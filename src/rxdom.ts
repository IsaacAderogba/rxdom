import {
  DOMElement,
  FiberElement,
  FiberInstance,
  RxElement,
  RxNode,
} from "./models";
import { Renderer, SyncRenderer } from "./renderers";

export class RxDOM {
  fiber: FiberInstance | undefined;
  renderer: Renderer;

  constructor(renderer = new SyncRenderer()) {
    this.renderer = renderer;
  }

  render(node: RxNode, dom: DOMElement) {
    const prevFiber = this.fiber;
    this.fiber = this.renderer.render(
      this.createRoot(dom),
      dom,
      prevFiber,
      node
    );
  }

  private createRoot(dom: DOMElement): FiberElement {
    const node: RxElement = {
      props: { content: [] },
      template: { dom },
      type: "element",
    };
    return { dom, content: [], node };
  }
}
