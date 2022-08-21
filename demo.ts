import { Component, div, el, input, RxDOM } from "./src";

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
