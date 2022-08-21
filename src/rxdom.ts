import { el } from "./fragments";
import { DOMElement, FiberFragment, FiberInstance, RxNode } from "./models";
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

  private createRoot(dom: DOMElement): FiberFragment {
    return { dom, content: [], node: el({ dom }) };
  }
}
