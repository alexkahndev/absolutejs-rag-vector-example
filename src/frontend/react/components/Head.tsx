type HeadProps = {
  cssPath?: string;
};

export const Head = ({ cssPath }: HeadProps) => (
  <head>
    <title>AbsoluteJS AI Chat - React</title>
    <meta charSet="utf-8" />
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    {cssPath && <link href={cssPath} rel="stylesheet" />}
  </head>
);
