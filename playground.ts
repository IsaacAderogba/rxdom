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
} from "./src";

type AppProviderProps = {
  todos: TodoProps[];
  addTodo: (name: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
};

const AppProvider = createProvider<AppProviderProps>();

type AppState = { todos: TodoProps[] };
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
    return AppProvider.Context({
      todos: this.state.todos,
      addTodo: this.addTodo,
      deleteTodo: this.deleteTodo,
      toggleTodo: this.toggleTodo,
      content: [
        div({
          content: [TodoForm({ key: "TodoForm" }), TodoList()],
        }),
      ],
    });
  }
}

const App = Component.FC(AppComponent);

type TodoFormContext = { app: AppProviderProps };
class TodoFormComponent extends Component<{}, {}, TodoFormContext> {
  state = { name: "" };

  render() {
    const { addTodo } = this.context.app;

    return form({
      style: { display: "flex", gap: "4px", alignItems: "center" },
      onsubmit: (e: Event) => {
        e.preventDefault();
        addTodo(this.state.name);
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
  app: AppProvider,
});

type TodoListContext = { app: AppProviderProps };
const TodoList = FC<{}, TodoListContext>(
  (_, { app: { todos } }) => {
    return ul({
      style: { display: "flex", flexDirection: "column", gap: "4px" },
      content: todos.map(todo => li({ content: [Todo(todo)] })),
    });
  },
  { app: AppProvider }
);

type TodoProps = {
  id: string;
  name: string;
  done: boolean;
};
type TodoContext = { app: AppProviderProps };

const Todo = FC<TodoProps, TodoContext>(
  (props, { app: { toggleTodo, deleteTodo } }) => {
    const { id, name, done } = props;

    return div({
      style: { display: "flex", gap: "4px", alignItems: "center" },
      content: [
        button({
          onclick: () => deleteTodo(id),
          content: ["X"],
        }),
        done,
        input({
          type: "checkbox",
          checked: done,
          onclick: () => toggleTodo(id),
        }),
        span({ content: [name] }),
      ],
    });
  },
  { app: AppProvider }
);

const rxdom = new RxDOM();
rxdom.render(App({ key: "root" }), document.getElementById("app")!);
