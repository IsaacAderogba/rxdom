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
import { RxDOM, composeFunction, h1 } from "@iatools/rxdom";

const App = composeFunction(() => {
  return h1({ content: ["hello, world!"] });
});

const rxdom = new RxDOM();
rxdom.render(App(), document.getElementById("app")!);
```

"hello, world!” using a function component

You can also use an ES6 class to define a component blueprint. This enables you to manage your own state and hook into lifecycle methods. These blueprints are then “componentized” using the static `Component.compose` method, leading to a consistent component usage experience.

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

const App = Component.compose(AppComponent);

const rxdom = new RxDOM();
rxdom.render(App({ key: "root" }), document.getElementById("app")!);
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
import { RxDOM, composeFunction, h1, i } from "@iatools/rxdom";

const App = composeFunction(() => {
  return h1({
    style: { color: "red" },
    content: [i({ content: ["hello, world!"] })],
  });
});

const rxdom = new RxDOM();
rxdom.render(App(), document.getElementById("app")!);
```

This renders a red `h1` tag with italicized content.

Additionally, RxDOM provides support for rendering external DOM elements into the user interface using the special `el` fragment.

> This was an important design goal for using RxDOM with my [Pine](https://github.com/IsaacAderogba/pine) editor framework. Pine, which uses the Prosemirror toolkit, likes to manage its own DOM representation at certain points. This allows for seamless integration between the two frameworks.

```typescript
import { Component, div, el, input, RxDOM } from "@iatools/rxdom";

const externalInput = document.createElement("input");

class AppComponent extends Component {
  state = { value: "" };

  render() {
    const internalInput = input({
      value: this.state.value,
      oninput: e => this.setState({ value: e.target.value }),
    });

    return div({
      content: [internalInput, el({ dom: externalInput })],
    });
  }
}

const App = Component.compose(AppComponent);

const rxdom = new RxDOM();
rxdom.render(App({ key: "root" }), document.getElementById("app")!);
```

#### Components

RxDOM supports the creation of function, class, and context components through `compose` factory functions.

**Function Components**

Function components are strictly functional, with no utilities to manage their own state. This makes them highly predictable. While unable to manage their own state, function components can still receive `props` from a direct parent component or `context` from ancestor provider components.

They’re created via `composeFunction` invocations.

```typescript
const FunctionComponent = composeFunction((props, context) => {
  return h1({ content: ["hello, world!"] });
});
```

**Class Components**

Class components enhance component functionality by providing a way to manage state and react to lifecycle events. By allowing management of state and lifecycle events, class components are incredibly powerful - at the cost of increased complexity.

Class blueprints are created by extending the `Component` constructor. Before use, they must be “componentized” through use of the `Component.compose` static method.

```typescript
class ClassBlueprint extends Component {
  state = { greeting: "hello, world!" };

  render() {
    console.log(this.props, this.context)
    return h1({ content: [this.state.greeting] })
  }
}
const ClassComponent = Component.compose(ClassBlueprint);
```

**Context Components**

Context components allow us to easily pass props down the component hierarchy. They’re similar to context components as defined by React. Unlike the components we’ve seen thus far, invoking `composeContext` will return both a `Provider` and a `Consumer`.

```typescript
type ContextProps = { greeting: string };
const [ContextProvider, ContextConsumer] = composeContext<ContextProps>(
  ({ props }) => {
    return div({ content: props.content });
  }
);
```

Any props passed to the `Provider` component will be made accessible to children `Consumer` components.

```typescript
// passes context props to the provider
const App = composeFunction(() => {
  return ContextProvider({
    greeting: "hello, world!",
    content: [Todo()],
  });
});

// consumes the context provided
const Todo = composeFunction(
  ({ context }) => {
    return div({ content: [context.consumer.greeting] });
  },
  { consumer: ContextConsumer }
);
```

Reserved props such as `content` and `key` are not passed down to the consumer.

**Example**

To get a sense for how function, class, and context components may be used together, the following  provides an example utilizing Typescript.

```typescript
// provider component
type ContextProps = { greeting: string };
const [ContextProvider, ContextConsumer] = composeContext<ContextProps>(
  ({ props }) => {
    return div({ content: props.content });
  }
);

// class component
class ClassBlueprint extends Component {
  state = { greeting: "hello, world!" };

  render() {
    return ContextProvider({
      greeting: this.state.greeting,
      content: [FunctionComponent({ greeting: "hello, world!" })],
    });
  }
}
const ClassComponent = Component.compose(ClassBlueprint);

// function component
const FunctionComponent = composeFunction<{}, { consumer: ContextProps }>(
  ({ context }) => {
    return h1({ content: [context.consumer.greeting] });
  },
  { consumer: ContextConsumer }
);

const rxdom = new RxDOM();
rxdom.render(ClassComponent({ key: "root" }), document.getElementById("app")!);
```

While only 25 lines of code, it packs a lot of information about the interaction between these component types.

#### Lifecycle Events

Class components supports four lifecycle methods:

**1) Construction**

This lifecycle can be hooked into by simply defining a constructor method. This allows you to define the initial state of your component based on the starting props.

```typescript
type AppState = { value: string };
type AppProps = { placeholder: string };


class AppComponent extends Component<AppState, AppProps> {
  constructor(config) {
    super(config);
    this.state = { value: props.placeholder || "Start writing..." };
  }

  ...
}
```

**2) Mounting**

A component mounts once all of its descendants have mounted. The `onMount` method allows you to hook into when this happens.

```typescript
class AppComponent extends Component<AppState, AppProps> {
  state = { value: ""}

  onMount() {
    console.log("Mounted");
  }

  ...
}
```

**3) Updating**

Components update either due to a change in their `state`, `props`, or `context`. The `onUpdate` method allows you to hook into such updates.

```typescript
class AppComponent extends Component<AppState, AppProps> {
  state = { value: ""}

  onUpdate() {
    console.log("Updated");
  }

  ...
}
```

> By the time `onUpdate` triggers, the component's UI will have already re-rendered. If you wish to tap in to this before-render phase, then you can use use the `render` method in the space before returning an element.

```typescript
class AppComponent extends Component<AppState, AppProps> {
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
class AppComponent extends Component<AppState, AppProps> {
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

#### Virtual DOM and Reconciliation

Unlike modern frameworks such as Svelte and SolidJs, RxDOM uses a Virtual DOM to minimize interaction with the real DOM. This is done by way of diff between Virtual DOM and real DOM nodes.

Further, RxDOM decides which DOM nodes to update through order-based and key-based reconciliation. Importantly, RxDOM only requires keys when creating stateful `Components`. While this may seem tedious, it helps avoid a lot of subtle problems with reconciliation that plague frameworks like React.

For example, many developers may not realize that the following presents a problem for components that manage state:

```html
return (
  <ul>
    <StatefulComponent type="b" />
    <StatefulComponent type="c" />
  </ul>
);
```

Render #1

```html
return (
  <ul>
    <StatefulComponent type="a" />
    <StatefulComponent type="b" />
    <StatefulComponent type="c" />
  </ul>
);
```

Render #2

Because the returned list differs between renders, React will match the previous `<StatefulComponent type="b" />` with the new `<StatefulComponent type="a" />`. This is troublesome, because `<StatefulComponent type="a" />` actually inherits the state of `<StatefulComponent type="b" />`  instead of creating its own. What's worse, React doesn't detect and warn you about these issues.

The simple fix for this, as well as a host of other subtle issues, is to require keys for stateful components.

#### Rx Nodes

When you create *fragments* and *components* using `RxDOM`, you are in fact creating `RxNodes`. These nodes are simple JavaScript objects which specify the `type` and `props` of an element.

```typescript
type RxNode =  RxFragment | RxComponent;
```

#### DOM Elements

RxDOM uses the spec from the `RxNodes` in order to construct `DOMElements`.

```typescript
type DOMElement = HTMLElement | Text;
```

#### Fiber Instances

To support Virtual DOM rendering, RxDOM introduces another data structure called a `FiberInstance`. A fiber instance simply keeps reference to the constructed `DOMElement`, the associated `RxNode` that was used for its construction, and any children or child `FiberInstances`.

```typescript
export type FiberInstance = FiberComponent | FiberFragment | FiberElement;
```

