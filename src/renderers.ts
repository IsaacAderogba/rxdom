import { Component } from "./components";
import {
  DOMElement,
  FiberComponent,
  FiberFragment,
  FiberInstance,
  RxComponent,
  RxNode,
} from "./models";
import { updateDomProps } from "./utils";

export interface Renderer {
  render: (
    root: FiberInstance,
    dom: DOMElement,
    fiber?: FiberInstance,
    node?: RxNode
  ) => FiberInstance | undefined;
}

export class SyncRenderer {
  render: Renderer["render"] = (root, dom, fiber, node) => {
    if (!fiber) {
      // create
      const newFiber = this.construct(root, node!);
      dom.appendChild(newFiber.dom);
      return newFiber;
    } else if (!node) {
      // remove
      fiber.content.forEach((child) => this.render(fiber, fiber.dom, child));
      fiber.dom.remove();
      if ("component" in fiber) fiber.component.unmount();
      return;
    } else if (fiber.node.props.key !== node.props.key) {
      // replace
      const newFiber = this.construct(root, node);
      dom.replaceChild(newFiber.dom, fiber.dom);
      fiber.content.forEach((child) => this.render(fiber, fiber.dom, child));
      if ("component" in fiber) fiber.component.unmount();
      return newFiber;
    } else if (node.type === "component") {
      // update component
      const cfiber = fiber as FiberComponent;
      cfiber.component.setProps(node);
      return cfiber;
    } else if (node.type === "element") {
      // update element fragment
      fiber.node = node;
      return fiber;
    } else {
      // update dom fragment
      const ffiber = fiber as FiberFragment;

      updateDomProps(ffiber.dom, ffiber.node.props, node.props);
      ffiber.content = this.reconcile(ffiber, node);
      ffiber.node = node;
      return ffiber;
    }
  };

  reconcile = (parent: FiberFragment, node: RxNode): FiberInstance[] => {
    const dom = parent.dom;
    const fibers = parent.content;
    const nodes = node.props.content || [];

    const instances: FiberInstance[] = [];
    const count = Math.max(fibers.length, nodes.length);
    for (let i = 0; i < count; i++) {
      const child = this.render(parent, dom, fibers[i], nodes[i]);
      if (child) instances.push(child);
    }

    return instances;
  };

  construct = (parent: FiberInstance, node: RxNode): FiberInstance => {
    if (node.type === "component") {
      const fiber = { node, parent, content: [] } as unknown as FiberComponent;

      fiber.component = new node.template.constructor({
        renderer: this,
        fiber,
      });
      const child = this.construct(fiber, fiber.component.render());
      fiber.dom = child.dom;
      fiber.content = [child];
      fiber.component.mount();

      return fiber;
    }

    if (node.type === "element") {
      const fiber: FiberFragment = {
        dom: node.props.dom,
        node,
        content: [],
        parent,
      };
      return fiber;
    }

    const dom =
      node.type === "text"
        ? document.createTextNode("")
        : document.createElement(node.type);

    updateDomProps(dom, {}, node.props);

    const fiber: FiberFragment = { dom, node, content: [], parent };
    const content = node.props.content || [];
    this.warnDuplicateKeys(fiber, content);
    fiber.content = content.map((c) => this.construct(fiber, c));
    fiber.content.forEach((child) => dom.appendChild(child.dom));

    return fiber;
  };

  private warnDuplicateKeys(parent: FiberInstance, nodes: RxNode[]) {
    const customComponents = nodes.filter((n) => {
      return n.type === "component" && n.template.constructor !== Component;
    }) as RxComponent[];

    const dups: Map<string, { name: string; count: number }> = new Map();
    customComponents.forEach(({ template: { constructor }, props }) => {
      const dup = dups.get(props.key) || { name: constructor.name, count: 0 };
      dups.set(props.key, { ...dup, count: dup.count + 1 });
    });

    for (const [key, { count, name }] of dups) {
      if (count > 1) {
        console.warn(
          `Each class component in a 'content' list should have a unique 'key' prop (detected ${count} ${name}s with key ${key}).`,
          parent
        );
      }
    }
  }
}
