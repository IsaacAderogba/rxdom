import { DOMElement, FiberInstance, RxNode } from "./models";
import { Renderer, SyncRenderer } from "./renderers";

export class RxDOM {
  fiber: FiberInstance | undefined;
  renderer: Renderer;

  constructor(renderer = new SyncRenderer()) {
    this.renderer = renderer;
  }

  render(node: RxNode, container: DOMElement) {
    const prevFiber = this.fiber;
    const nextFiber = this.renderer.reconcile(container, prevFiber, node);
    this.fiber = nextFiber;
  }
}
