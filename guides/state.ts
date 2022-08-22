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
} from "../src";

// store
type TodoModel = {
  id: number;
  name: string;
  done: boolean;
};

interface StoreState {
  todos: TodoModel[];
}

interface StoreActions {
  toggleTodo: (id: TodoModel["id"]) => void;
}

type StoreContextProps = StoreState & StoreActions;
const [StoreProvider, storeSelector] = composeContext<StoreContextProps>(
  ({ props }) => div({ content: props.content })
);

// TodoApp
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

// TodoList
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

// TodoItem
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

const rxdom = new RxDOM();
rxdom.render(TodoApp({ key: "root" }), document.getElementById("app")!);
