import {
  DOMElement,
  FiberComponent,
  FiberElement,
  FiberFragment,
  FiberInstance,
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
      fiber.content.forEach(child => this.render(fiber, fiber.dom, child));
      fiber.dom.remove();
      if ("component" in fiber) fiber.component.unmount();
      return;
    } else if (fiber.node.key !== node.key) {
      // replace
      const newFiber = this.construct(root, node);
      dom.replaceChild(newFiber.dom, fiber.dom);
      fiber.content.forEach(child => this.render(fiber, fiber.dom, child));
      if ("component" in fiber) fiber.component.unmount();
      return newFiber;
    } else if (node.type === "element") {
      // update element
      fiber.dom = node.template.onUpdate({ fiber, dom: node.template.dom });
      fiber.node = node;
      return fiber;
    } else if (node.type === "component") {
      // update component
      const cfiber = fiber as FiberComponent;
      return cfiber.component.setProps(node);
    } else {
      // update fragment
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
    const nodes = node.props.content;

    const instances: FiberInstance[] = [];
    const count = Math.max(fibers.length, nodes.length);
    for (let i = 0; i < count; i++) {
      const child = this.render(parent, dom, fibers[i], nodes[i]);
      if (child) instances.push(child);
    }

    return instances;
  };

  construct = (parent: FiberInstance, node: RxNode): FiberInstance => {
    if (node.type === "element") {
      const fiber: FiberElement = {
        dom: node.template.dom,
        node,
        content: [],
        parent,
      };
      return fiber;
    }

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

    const dom =
      node.type === "text"
        ? document.createTextNode("")
        : document.createElement(node.type);

    updateDomProps(dom, {}, node.props);

    const fiber: FiberFragment = { dom, node, content: [], parent };
    fiber.content = node.props.content.map(c => this.construct(fiber, c));
    fiber.content.forEach(child => dom.appendChild(child.dom));

    return fiber;
  };
}
