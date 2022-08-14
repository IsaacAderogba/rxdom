# RxDOM, a zero-dependency JavaScript library for building reactive user interfaces

[RxDOM](https://github.com/IsaacAderogba/rxdom) is s a JavaScript library for creating user interfaces. Instead of requiring a compilation step like modern frameworks, RxDOM works with HTML **fragments**, **components**, and **elements** directly to construct reactive interfaces.

RxDOM attempts to be a middle ground between writing laborious vanilla JavaScript and using heavyweight frameworks such as React or NextJs. This makes it suitable for small projects. For my needs, this means rapid prototyping and experimentation without the complicated setup of Webpack and so on.

| Library          | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `@iatools/rxdom` | Zero-dependency library for creating user interfaces. |

> RxDOM, like many of my projects, has been primarily built for my use cases. If you wish to extend the base functionality, you're encouraged to fork the package.

## Guides

#### Installation

RxDOM can be installed through your preferred package manager.

```shell
npm install @iatools/rxdom
```

You can then import the `RxDOM` class and any desired component and fragment functions.

```typescript
import { RxDOM, FC, h1 } from "@iatools/rxdom";

const App = FC(() => {
  return h1({ content: ["hello, world!"] });
});

const rxdom = new RxDOM();
rxdom.render(App(), document.getElementById("app")!);
```

"hello, world!” using a function component

You can also use an ES6 class to define a component. This enables you to manage your own state and hook into lifecycle methods. Components are then “functionalized” using the static `Component.FC` method, leading to a consistent component usage experience.

```typescript
import { RxDOM, Component, h1 } from "@iatools/rxdom";

class AppComponent extends Component {
  state = { greeting: "hello, world!" };

  onMount() {
    console.log("App mounted");
    return () => console.log("App unmounted");
  }

  render() {
    return h1({ content: [this.state.greeting] });
  }
}

const App = Component.FC(AppComponent);

const rxdom = new RxDOM();
rxdom.render(App(), document.getElementById("app")!);
```

"hello, world!” using a class component and lifecycle methods.

## Docs

#### Fragments

A **fragment** in RxDOM is a lightweight wrapper around a HTML tag. RxDOM exports fragments for each valid tag.

```typescript
import { a, abbr, address, ... } from "@iatools/rxdom"
```

Using fragments is then as simple as invoking them and optionally passing child fragments or primitive values as their content.

```typescript
import { RxDOM, FC, h1, i } from "@iatools/rxdom";

const App = FC(() => {
  return h1({
    style: { color: "red" },
    content: [i({ content: ["hello, world!"] })],
  });
});

const rxdom = new RxDOM();
rxdom.render(App(), document.getElementById("app")!);
```

This renders a red `h1` tag with italicized content.

By convention, fragments are lower cased.

#### Components

RxDOM supports both function components and class components

```typescript
import { RxDOM, Component, h1, FC } from "@iatools/rxdom";

type Props = { greeting: string };
const FunctionComponent = FC<Props>(props => {
  return h1({ content: [props.greeting] });
});

class ClassComponent extends Component {
  render() {
    return FunctionComponent({ greeting: "hello, world!" });
  }
}

const Class = Component.FC(ClassComponent);

const rxdom = new RxDOM();
rxdom.render(Class(), document.getElementById("app")!);
```

"hello, world!” using a function component

In order to use a class component, it must be *functionalized* using the `Component.FC` constructor. While an extra step, it creates a consistent component usage experience.

By convention, components are title cased.

#### Elements

RxDOM provides first class support for rendering arbitrary DOM elements into the user interface. While elements are treated as black boxes for the most part, RxDOM provides an update hook for when their parent fragments or components have changed.

> This was an important design goal for using RxDOM with my [Pine](https://github.com/IsaacAderogba/pine) editor framework. Pine, which uses the Prosemirror toolkit, likes to manage its own DOM representation for its content blocks. This allows for seamless integration of those content blocks.

```typescript
import { RxDOM, Component, createElement, div, input } from "@iatools/rxdom";

const externalInput = createElement({
  dom: document.createElement("input"),
  updater: ({ dom }) => dom,
});

class AppComponent extends Component<{}, string> {
  state = "";

  render() {
    const internalInput = input({
      value: this.state,
      oninput: e => this.setState(e.target.value),
    });

    return div({
      content: [internalInput, externalInput],
    });
  }
}

const App = Component.FC(AppComponent);

const rxdom = new RxDOM();
rxdom.render(App(), document.getElementById("app")!);
```

#### Lifecycle Events

Class components supports four lifecycle methods:

**1) Construction**

This lifecycle can be hooked into by simply defining a constructor method. This allows you to define the initial state of your component based on the starting props.

```typescript
type AppProps = { placeholder: string };
type AppState = { value: string };

class AppComponent extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = { value: props.placeholder || "Start writing..." };
  }

  ...
}
```

**2) Mounting**

A component mounts once all if its descendants have mounted. The `onMount` method allows you to hook into this.

```typescript
class AppComponent extends Component<AppProps, AppState> {
  state = { value: ""}

  onMount() {
    console.log("Mounted");
  }

  ...
}
```

**3) Updating**

Components update either due to a `state` change or a change in their `props`. The `onUpdate` method allows you to respond to such updates.

```typescript
class AppComponent extends Component<AppProps, AppState> {
  state = { value: ""}

  onUpdate() {
    console.log("Updated");
  }

  ...
}
```

> By the time `onUpdate` triggers, the component's UI will have already re-rendered. If you wish to tap in to this before-render phase, then you can use use the `render` method in the space before returning an element. By this point, you would still have the updated props or state.

```typescript
class AppComponent extends Component<AppProps, AppState> {
  state = { value: "" };

  render() {
    console.log("Before render");

    return div({ ... });
  }
}
```

**4) Unmounting**

Lastly RxDOM allows you to do clean up logic just before a component unmounts. To tap into this lifecycle, simply return a function from the `onMount` lifecycle described above.

```typescript
class AppComponent extends Component<AppProps, AppState> {
  state = { value: "" };

  onMount() {
    console.log("Mount")
    return () => {
      console.log("Unmount");
    };
  }

  ...
}
```

#### Renderers

RxDOM abstracts DOM rendering into a `Renderer` interface. It currently exports a `SyncRenderer` but can be extended to support async rendering if performance is paramount.

```typescript
const rxdom = new RxDOM(new SyncRenderer());
rxdom.render(App(), document.getElementById("app")!);
```

> This was another important design goal for using RxDOM with [Pine](https://github.com/IsaacAderogba/pine). Pine's content DOM relies on predictable, synchronous rendering. Trying to manage the content DOM with an asynchronous renderer leads to subtle [bugs](https://discuss.prosemirror.net/t/react-node-view-loses-selection-when-switching-between-block-types/4691/3).

#### Virtual DOM

Unlike modern frameworks such as Svelte and SolidJs, RxDOM uses a Virtual DOM to minimize interaction with the real DOM. This is done by way of diff between Virtual DOM and real DOM nodes.

Importantly, RxDOM doesn’t require you to specify `keys` when constructing different components or nodes. This leads to improved developer productivity - at the expense of performance in the situations that involve reordering child nodes.

#### Rx Nodes

When you create *fragments, components*, and *elements* using `RxDOM`, you are in fact creating `RxNode`s. These nodes are simple JavaScript objects which specify the `type` and `props` of an element.

Naturally, an `RxNode` can either be a fragment, component, or element:

```typescript
type RxNode =  RxFragment | RxComponent | RxElement;
```

#### DOM Elements

RxDOM uses the spec from the `RxNode`s in order to construct `DOMElement`s.

```typescript
type DOMElement = HTMLElement | Text;
```

#### Fiber Instances

To support Virtual DOM rendering, RxDOM introduces another data structure called a `FiberInstance`. A fiber instance simply keeps reference to the constructed `DOMElement`, the associated `RxNode` that was used for its construction, and any children or child `FiberInstance`s. Similarly, there's different fiber instance types for fragments, components, and elements:

```typescript
export type FiberInstance = FiberComponent | FiberFragment | FiberElement;
```

