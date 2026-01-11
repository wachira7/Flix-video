// frontend-web/css.d.ts
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
declare module '*.module.css' {
  const classes: { [className: string]: string };
  export default classes;
}
declare module '*.scss';
declare module '*.sass';