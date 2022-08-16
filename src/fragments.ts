import { RxFragment } from "./models";
import { ContentProps, createContent, Attrs } from "./utils";

type FragmentProps = Partial<
Attrs &
    Partial<GlobalEventHandlers> & {
      style?: Partial<CSSStyleDeclaration>;
    } & ContentProps
>;

const createFragment = (
  type: RxFragment["type"],
  props: FragmentProps
): RxFragment => {
  const content = createContent(props);
  return { type, props: { ...props, content } };
};

const fragment =
  (type: RxFragment["type"]) =>
  (props: Partial<FragmentProps> = {}) =>
    createFragment(type, props);

export const a = fragment("a");
export const abbr = fragment("abbr");
export const address = fragment("address");
export const area = fragment("area");
export const article = fragment("article");
export const aside = fragment("aside");
export const audio = fragment("audio");
export const b = fragment("b");
export const base = fragment("base");
export const bdi = fragment("bdi");
export const bdo = fragment("bdo");
export const blockquote = fragment("blockquote");
export const body = fragment("body");
export const br = fragment("br");
export const button = fragment("button");
export const canvas = fragment("canvas");
export const caption = fragment("caption");
export const cite = fragment("cite");
export const code = fragment("code");
export const col = fragment("col");
export const colgroup = fragment("colgroup");
export const data = fragment("data");
export const datalist = fragment("datalist");
export const dd = fragment("dd");
export const del = fragment("del");
export const details = fragment("details");
export const dfn = fragment("dfn");
export const dialog = fragment("dialog");
export const dir = fragment("dir");
export const div = fragment("div");
export const dl = fragment("dl");
export const dt = fragment("dt");
export const em = fragment("em");
export const embed = fragment("embed");
export const fieldset = fragment("fieldset");
export const figcaption = fragment("figcaption");
export const figure = fragment("figure");
export const font = fragment("font");
export const footer = fragment("footer");
export const form = fragment("form");
export const frame = fragment("frame");
export const frameset = fragment("frameset");
export const h1 = fragment("h1");
export const h2 = fragment("h2");
export const h3 = fragment("h3");
export const h4 = fragment("h4");
export const h5 = fragment("h5");
export const h6 = fragment("h6");
export const head = fragment("head");
export const header = fragment("header");
export const hgroup = fragment("hgroup");
export const hr = fragment("hr");
export const html = fragment("html");
export const i = fragment("i");
export const iframe = fragment("iframe");
export const img = fragment("img");
export const input = fragment("input");
export const ins = fragment("ins");
export const kbd = fragment("kbd");
export const label = fragment("label");
export const legend = fragment("legend");
export const li = fragment("li");
export const link = fragment("link");
export const main = fragment("main");
export const map = fragment("map");
export const mark = fragment("mark");
export const marquee = fragment("marquee");
export const menu = fragment("menu");
export const meta = fragment("meta");
export const meter = fragment("meter");
export const nav = fragment("nav");
export const noscript = fragment("noscript");
export const object = fragment("object");
export const ol = fragment("ol");
export const optgroup = fragment("optgroup");
export const option = fragment("option");
export const output = fragment("output");
export const p = fragment("p");
export const param = fragment("param");
export const picture = fragment("picture");
export const pre = fragment("pre");
export const progress = fragment("progress");
export const q = fragment("q");
export const rp = fragment("rp");
export const rt = fragment("rt");
export const ruby = fragment("ruby");
export const s = fragment("s");
export const samp = fragment("samp");
export const script = fragment("script");
export const section = fragment("section");
export const select = fragment("select");
export const slot = fragment("slot");
export const small = fragment("small");
export const source = fragment("source");
export const span = fragment("span");
export const strong = fragment("strong");
export const style = fragment("style");
export const sub = fragment("sub");
export const summary = fragment("summary");
export const sup = fragment("sup");
export const table = fragment("table");
export const tbody = fragment("tbody");
export const td = fragment("td");
export const template = fragment("template");
export const textarea = fragment("textarea");
export const tfoot = fragment("tfoot");
export const th = fragment("th");
export const thead = fragment("thead");
export const time = fragment("time");
export const title = fragment("title");
export const tr = fragment("tr");
export const track = fragment("track");
export const u = fragment("u");
export const ul = fragment("ul");
export const video = fragment("video");
export const wbr = fragment("wbr");
