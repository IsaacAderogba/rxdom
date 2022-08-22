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

#### State Management

In this guide, we’ll discuss the core concepts of state management in RxDOM.

Put simply, state management is a way to facilitate communication and sharing of data across components. In RxDOM, state management is best done through the use of context components. Context components are useful when our data needs to be made accessible at varying levels of depth.

To start this guide, let’s first get our imports out of the way:

```typescript
import {
  // renderer
  RxDOM,
  // component creators
  Component,
  composeContext,
  composeFunction,
  // fragment creators
  div,
  ul,
  li,
  input,
} from "@iatools/rxdom";
```

We’ll be building a simple todo application, so let’s first define the data model for what a todo looks like.

```typescript
type TodoModel = {
  id: number;
  name: string;
  done: boolean;
};
```

When thinking about state management, it’s useful to think about the *state* of our application and the *actions* that can transition that state. For our state, we'll be working with an array of todos, so let's formalize that in our `StoreState` interface.

```typescript
interface StoreState {
  todos: TodoModel[];
}
```

To keep our actions simple, we’ll allow our users to toggle todos as completed or not. We’ll similarly define this in a `StoreActions` interface.

```typescript
interface StoreActions {
  toggleTodo: (id: TodoModel["id"]) => void;
}
```

> It's not strictly necessary to separate state and actions as I've done. You could unify these two interfaces if you wish (though we'll do that later).

Because we want both our *state* and our *actions* to be accessible by all of our components, we’ll set up a context component. In RxDOM, context components are created by calling the `composeContext` factory method.

```typescript
type StoreContextProps = StoreState & StoreActions;
const [StoreProvider, storeSelector] = composeContext<StoreContextProps>(
  ({ props }) => div({ content: props.content })
);
```

This factory method expects us to return a html fragment, and in turn gives us a provider component and a context selector function.

To see the `StoreProvider` in action, let's define a class component that is capable of managing the `todos` state. This component will also define a `toggleTodo` method and pass both the method and the state to our `StoreProvider`.

```typescript
type TodoAppState = Pick<StoreContextProps, "todos">;
class TodoAppBlueprint extends Component<TodoAppState> {
  state = {
    todos: [
      { id: 1, name: "Manage state", done: false },
      { id: 2, name: "Publish docs", done: false },
    ],
  };

  toggleTodo = (id: number) => {
    this.setState((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) => {
        if (todo.id === id) return { ...todo, done: !todo.done };
        return todo;
      }),
    }));
  };

  render() {
    return StoreProvider({
      todos: this.state.todos,
      toggleTodo: this.toggleTodo,
      content: [TodoList()],
    });
  }
}

const TodoApp = Component.compose(TodoAppBlueprint);
```

Creating class components in this manner should feel familiar if you have prior experience with react. Importantly, the `todos` and `toggleTodo` properties which we pass to our `StoreProvider` will now be accessible by any child components - without having to pass props directly. Because classes act as blueprints, we'll need to componentize this class by calling the `Component.compose` static method.

At this juncture, we’ll now see how a descendent component can consume the props of an ancestor. Let’s write our `TodoList` function component.

```typescript
type TodoListContext = { store: Pick<StoreContextProps, "todos"> };

const TodoList = composeFunction<{}, TodoListContext>(
  ({ context }) => {
    const todos = context.store.todos;

    return ul({ content: todos.map((todo) => TodoItem(todo)) });
  },
  {
    store: storeSelector<TodoListContext["store"]>((state) => ({
      todos: state.todos,
    })),
  }
);
```

This demonstrates that when we want a component to consume some context, we provide a second argument to our `composeFunction` factory method. This argument must be an object, with each key-value pair representing a context selector. Because our `TodoList` only needs access to the `todos` property, we can specify this in the body of our invoked `storeSelector` .

> Importantly, RxDOM will only re-render a component when its state, props, or context has changed. By using our selector to consume just the properties needed, we're in turn optimizing the performance of our application.

By now you should be familiar with how state management works. Our second last step will be to define the `TodoItem` component which ultimately calls the `toggleTodo` method. Similarly, this component consumes a specific slice of the store context.

```typescript
export type TodoItemProps = TodoModel;
export type TodoItemContext = { store: Pick<StoreContextProps, "toggleTodo"> };
const TodoItem = composeFunction<TodoItemProps, TodoItemContext>(
  ({ props, context }) => {
    const { id, name, done } = props;
    const { toggleTodo } = context.store;

    return li({
      content: [
        input({
          type: "checkbox",
          checked: done,
          onclick: () => toggleTodo(id),
        }),
        name,
      ],
    });
  },
  { store: storeSelector((state) => ({ toggleTodo: state.toggleTodo })) }
);
```

Attaching our app to the DOM is then as simple as creating an `RxDOM` instance and calling `render` on it with the necessary arguments.

```typescript
const rxdom = new RxDOM();
rxdom.render(TodoApp({ key: "root" }), document.getElementById("app")!);
```

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

Function components are strictly functional, with no utilities to manage their own state. This makes them highly predictable. While unable to manage their own state, function components can still receive `props` from a direct parent component or `context` from ancestor context components.

They’re created via `composeFunction` invocations.

```typescript
const FunctionComponent = composeFunction(({ props, context }) => {
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

Context components allow us to easily pass props down the component hierarchy. They’re similar to context components as defined by React. Unlike the components we’ve seen thus far, invoking `composeContext` will return both a provider component and a context selector function.

```typescript
type ContextProps = { greeting: string };
const [ContextProvider, contextSelector] = composeContext<ContextProps>(
  ({ props }) => {
    return div({ content: props.content });
  }
);
```

We pass the required props to the provider, while the selector can selectively choose which props to access. As a guideline, always try to access the minimum amount of props. RxDOM will use this when deciding whether to re-render a component. In general, RxDOM will not re-render a component if the state, props, or context have not changed.

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
  { consumer: contextSelector((props) => ({ greeting: props.greeting })) }
);
```

Reserved props such as `content` and `key` are not passed down to the selector.

**Example**

To get a sense for how function, class, and context components may be used together, the following  provides an example utilizing Typescript.

```typescript
// provider component
type ContextProps = { greeting: string };
const [ContextProvider, contextSelector] = composeContext<ContextProps>(
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
type Context = { props: ContextProps };

const FunctionComponent = composeFunction<{}, Context>(
  ({ context }) => {
    return h1({ content: [context.props.greeting] });
  },
  { props: contextSelector<Context["props"]>() }
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

