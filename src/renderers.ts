import {
  DOMElement,
  FiberComponent,
  FiberFragment,
  FiberInstance,
  RxNode,
} from "./models";
import { updateDomProps } from "./utils";

export interface Renderer {
  reconcile: (
    dom: DOMElement,
    fiber?: FiberInstance,
    node?: RxNode
  ) => FiberInstance | undefined;
}

export class SyncRenderer {
  reconcile: Renderer["reconcile"] = (dom, fiber, node) => {
    if (!fiber) {
      // create
      const newFiber = this.construct(node!);
      dom.appendChild(newFiber.dom);
      return newFiber;
    } else if (!node) {
      // remove
      fiber.content.forEach(child => this.reconcile(fiber.dom, child));
      (fiber as FiberComponent).component?.unmount();
      fiber.dom.remove();
      return;
    } else if (fiber.node.type !== node.type) {
      // replace
      const newFiber = this.construct(node);
      dom.replaceChild(newFiber.dom, fiber.dom);
      return newFiber;
    } else if (node.type === "element") {
      // update element
      if (node.onUpdate) fiber.dom = node.onUpdate({ fiber, dom: node.dom });
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
      ffiber.content = this.reconcileContent(ffiber, node);
      ffiber.node = node;
      return ffiber;
    }
  };

  reconcileContent = (fiber: FiberFragment, node: RxNode): FiberInstance[] => {
    const dom = fiber.dom;
    const fibers = fiber.content;
    const nodes = node.props.content;

    const instances: FiberInstance[] = [];
    const count = Math.max(fibers.length, nodes.length);
    for (let i = 0; i < count; i++) {
      const child = this.reconcile(dom, fibers[i], nodes[i]);
      if (child) instances.push(child);
    }

    return instances;
  };

  construct = (node: RxNode): FiberInstance => {
    if (node.type === "element") return { dom: node.dom, node, content: [] };

    if (node.type === "component") {
      const component = new node.component(node.props);
      const child = this.construct(component.render());
      const fiber: FiberComponent = {
        dom: child.dom,
        node,
        content: [child],
        component,
      };
      component.mount(this, fiber);

      return fiber;
    }

    const dom =
      node.type === "text"
        ? document.createTextNode("")
        : document.createElement(node.type);

    updateDomProps(dom, {}, node.props);
    const content = node.props.content.map(this.construct);
    content.forEach(child => dom.appendChild(child.dom));

    return { dom, node, content };
  };
}
