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
  el,
  composeFunction,
  composeContext,
} from "./src";

const customDOM = document.createElement("input");

type AppContextProps = {
  todos: TodoProps[];
  addTodo: (name: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
};

const [AppProvider, AppConsumer] = composeContext<AppContextProps>(
  ({ props }) => {
    return div({ content: props.content });
  }
);

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
    return AppProvider({
      todos: this.state.todos,
      addTodo: this.addTodo,
      deleteTodo: this.deleteTodo,
      toggleTodo: this.toggleTodo,
      content: [
        div({
          content: [
            TodoForm({ key: "TodoForm" }),
            TodoList(),
            el({ dom: customDOM }),
          ],
        }),
      ],
    });
  }
}

const App = Component.compose(AppComponent);

type TodoFormContext = { app: AppContextProps };
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
          content: ["Add new item"],
        }),
        input({
          value: this.state.name,
          oninput: (e: any) =>
            this.setState(s => ({ ...s, name: e.target.value })),
        }),
      ],
    });
  }
}

const TodoForm = Component.compose(TodoFormComponent, {
  app: AppConsumer,
});

type TodoListContext = { app: AppContextProps };
const TodoList = composeFunction<{}, TodoListContext>(
  ({ context, props }) => {
    const todos = context.app.todos;

    return ul({
      style: { display: "flex", flexDirection: "column", gap: "4px" },
      content: todos.map(todo => li({ content: [Todo(todo)] })),
    });
  },
  { app: AppConsumer }
);

type TodoProps = {
  id: string;
  name: string;
  done: boolean;
};
type TodoContext = { app: AppContextProps };

const Todo = composeFunction<TodoProps, TodoContext>(
  ({ props, context }) => {
    const { id, name, done } = props;
    const { toggleTodo, deleteTodo } = context.app;

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
  { app: AppConsumer }
);

const rxdom = new RxDOM();
rxdom.render(App({ key: "root" }), document.getElementById("app")!);
