import { Component, createComponent } from "./components";
import { div } from "./fragments";
import { RxComponent } from "./models";
import { ContentProps, Attrs } from "./utils";

export class ContextProvider<V extends Attrs = Attrs> {
  value!: V;

  Context({ content, ...value }: ContentProps & V): RxComponent {
    this.value = value as V;

    return createComponent(
      {
        constructor: Component,
        provider: this,
        render: props => div(props),
      },
      { props: { content }, context: {} }
    );
  }
}

export const createProvider = <P extends Attrs>() => new ContextProvider<P>();
