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
} from "./src";

type AppState = { todos: TodoAttrs[] };
class AppComponent extends Component<AppState, {}> {
  state: AppState = { todos: [] };

  onUpdate() {
    console.log(this);
  }

  addItem = (name: string) => {
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
    return div({
      content: [
        TodoForm({ addItem: this.addItem }),
        TodoList({
          todos: this.state.todos,
          actions: {
            deleteTodo: this.deleteTodo,
            toggleTodo: this.toggleTodo,
          },
        }),
      ],
    });
  }
}

const App = Component.FC(AppComponent);

class TodoFormComponent extends Component<
  {},
  { addItem: (name: string) => void }
> {
  state = { name: "" };

  render() {
    return form({
      style: { display: "flex", gap: "4px", alignItems: "center" },
      onsubmit: (e: Event) => {
        e.preventDefault();
        this.props.addItem(this.state.name);
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

const TodoForm = Component.FC(TodoFormComponent);

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

const Todo = FC<TodoProps>(props => {
  const { id, name, done, toggleTodo, deleteTodo } = props;

  return div({
    style: { display: "flex", gap: "4px", alignItems: "center" },
    content: [
      button({
        onclick: () => deleteTodo(id),
        content: ["X"],
      }),
      done,
      input({ type: "checkbox", checked: done, onclick: () => toggleTodo(id) }),
      span({ content: [name] }),
    ],
  });
});

const rxdom = new RxDOM();
rxdom.render(App(), document.getElementById("app")!);
