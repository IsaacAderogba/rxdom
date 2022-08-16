import { RxNode } from "./models";
import { ContentProps, Attrs } from "./utils";

export class Context<P extends Attrs = Attrs> {
  Provider(props: Required<ContentProps> & P): RxNode {
    // needs to somehow be associated
  }
}

export const createContext = <P extends Attrs>() => {
  return new Context<P>();
};
