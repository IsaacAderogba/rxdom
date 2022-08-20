import {
  button,
  div,
  li,
  RxDOM,
  ul,
  Component,
  form,
  label,
  input,
  span,
  FC,
  createProvider,
  b,
  i,
} from "./src";

type StoreProvider = {
  todos: TodoAttrs[];
  addTodo: (name: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
};

const storeProvider = createProvider<StoreProvider>();

type AppState = { todos: TodoAttrs[] };
class AppComponent extends Component<AppState, {}> {
  state: AppState = { todos: [] };

  addTodo = (name: string) => {
    this.setState(prev => ({
      todos: [...prev.todos, { id: Date.now().toString(), done: false, name }],
    }));
  };

  toggleTodo = (id: string) => {
    this.setState(prev => ({
      ...prev,
      todos: prev.todos.map(todo => {
        if (todo.id === id) return { ...todo, done: !todo.done };
        return todo;
      }),
    }));
  };

  deleteTodo = (id: string) => {
    this.setState(prev => ({
      ...prev,
      todos: prev.todos.filter(todo => todo.id !== id),
    }));
  };

  render() {
    return storeProvider.Context({
      todos: this.state.todos,
      addTodo: this.addTodo,
      deleteTodo: this.deleteTodo,
      toggleTodo: this.toggleTodo,
      content: [
        div({
          content: [
            // TodoForm({ addTodo: this.addTodo, key: "TodoForm" }),
            TodoForm({ addTodo: this.addTodo, key: "TodoForm" }),
            TodoList({
              todos: this.state.todos,
              actions: {
                deleteTodo: this.deleteTodo,
                toggleTodo: this.toggleTodo,
              },
            }),
          ],
        }),
      ],
    });
  }
}

const App = Component.FC(AppComponent);

type TodoFormProps = { addTodo: (name: string) => void };
type TodoFormContext = { store: StoreProvider };

class TodoFormComponent extends Component<{}, TodoFormProps, TodoFormContext> {
  state = { name: "" };

  render() {
    return form({
      style: { display: "flex", gap: "4px", alignItems: "center" },
      onsubmit: (e: Event) => {
        e.preventDefault();
        this.props.addTodo(this.state.name);
        this.setState({ name: "" });
      },
      content: [
        label({
          for: "i-n",
          content: ["Add new item"],
        }),
        input({
          id: "i-n",
          value: this.state.name,
          oninput: (e: any) =>
            this.setState(s => ({ ...s, name: e.target.value })),
        }),
      ],
    });
  }
}

const TodoForm = Component.FC(TodoFormComponent, {
  store: storeProvider,
});

const TodoList = FC<{ todos: TodoAttrs[]; actions: TodoActions }>(
  ({ todos, actions }) => {
    return ul({
      style: { display: "flex", flexDirection: "column", gap: "4px" },
      content: todos.map(todo =>
        li({ content: [Todo({ ...todo, ...actions })] })
      ),
    });
  }
);

interface TodoAttrs {
  id: string;
  name: string;
  done: boolean;
}

interface TodoActions {
  toggleTodo(id: string): void;
  deleteTodo(id: string): void;
}

type TodoProps = TodoAttrs & TodoActions;
type TodoContext = { store: StoreProvider };

const Todo = FC<TodoProps, TodoContext>(
  (props, context) => {
    console.log("access", context);
    const { id, name, done, toggleTodo, deleteTodo } = props;

    return div({
      style: { display: "flex", gap: "4px", alignItems: "center" },
      content: [
        button({
          onclick: () => deleteTodo(id),
          content: ["X"],
        }),
        done ? Dummy({ done }) : Dummy2({ done }),
        input({
          type: "checkbox",
          checked: done,
          onclick: () => toggleTodo(id),
        }),
        span({ content: [name] }),
      ],
    });
  },
  { store: storeProvider }
);

const Dummy = FC<{ done: boolean }>(({ done }) => {
  return b({ content: [done] });
});

const Dummy2 = FC<{ done: boolean }>(({ done }) => {
  return i({ content: [done] });
});

const rxdom = new RxDOM();
rxdom.render(App({ key: "root" }), document.getElementById("app")!);
