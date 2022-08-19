import { DOMElement, RxFragment, RxNode } from "./models";

export type ContentProps = { content?: (RxNode | TextFragment)[] };
export const createContent = ({ content = [] }: ContentProps) =>
  content.map(c => (typeof c === "object" ? c : textFragment(c)));

type TextFragment = string | number | boolean;
const textFragment = (text: TextFragment): RxFragment => ({
  type: "text",
  props: { nodeValue: text.toString(), content: [] },
});

export function updateDomProps(
  dom: DOMElement,
  prevProps: Attrs,
  nextProps: Attrs
) {
  // attrs
  Object.keys(prevProps)
    .filter(isAttr)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => ((dom as any)[name] = null));

  Object.keys(nextProps)
    .filter(isAttr)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => ((dom as any)[name] = nextProps[name]));

  if (dom instanceof HTMLElement) {
    // styles
    prevProps.style = prevProps.style || {};
    nextProps.style = nextProps.style || {};

    Object.keys(nextProps.style)
      .filter(isNew(prevProps.style, nextProps.style))
      .forEach((key: any) => (dom.style[key] = nextProps.style[key]));

    Object.keys(prevProps.style)
      .filter(isGone(prevProps.style, nextProps.style))
      .forEach((key: any) => (dom.style[key] = ""));
  }
}

export const isStyle = (key: string) => key === "style";
export const isAttr = (key: string) => key !== "content" && !isStyle(key);
export const isNew = (prev: Attrs, next: Attrs) => (key: string) =>
  prev[key] !== next[key];
export const isGone = (_prev: Attrs, next: Attrs) => (key: string) =>
  !(key in next);

export type Attrs = Record<string, any>;
export type ValueOf<T> = T[keyof T];
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type OptionalPick<T, K extends keyof T> = Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = Partial<T> &
  Required<OptionalPick<T, K>>;
