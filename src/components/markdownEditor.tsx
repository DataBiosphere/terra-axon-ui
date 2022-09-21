import MDEditor, {
  commands,
  ICommand,
  MDEditorProps,
} from "@uiw/react-md-editor";
import { ReactElement } from "react";
import rehypeSanitize from "rehype-sanitize";

const write: ICommand = {
  ...commands.codeEdit,
  icon: <div>write</div>,
};

const preview: ICommand = {
  ...commands.codePreview,
  icon: <div>preview</div>,
};

export function MarkdownEditor(props: MDEditorProps): ReactElement {
  return (
    <MDEditor
      {...props}
      style={{ position: "static" }}
      preview="edit"
      previewOptions={{
        rehypePlugins: [[rehypeSanitize]],
      }}
      commands={[
        write,
        preview,
        commands.divider,
        commands.title,
        commands.bold,
        commands.italic,
        commands.quote,
        commands.code,
        commands.link,
        commands.unorderedListCommand,
        commands.orderedListCommand,
      ]}
      extraCommands={[]}
    />
  );
}

export function Markdown({ value }: { value: string }): ReactElement {
  return (
    <MDEditor.Markdown source={value} rehypePlugins={[[rehypeSanitize]]} />
  );
}
