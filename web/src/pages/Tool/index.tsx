import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import { Helmet } from "react-helmet";
import { IHeaderType, ITool } from "@/types";
import { ClipboardCode } from "@/components";
import { replaceHoudiniVariables, getTool } from "@/utils/helper";
import { useToolbox } from "@/context";
import { useStyle } from "@/context/style";

const Loading = () => {
  return (
    <div className="flex items-center justify-center space-x-2 animate-bounce mt-16">
      <div className="w-8 h-8 bg-sky-400 rounded-full"></div>
      <div className="w-8 h-8 bg-red-400 rounded-full"></div>
      <div className="w-8 h-8 bg-sky-400 rounded-full"></div>
      <div className="w-8 h-8 bg-red-400 rounded-full"></div>
    </div>
  );
};

const Tool = () => {
  const { setHeaderType } = useStyle();
  const { name } = useParams();
  const { toolbox } = useToolbox();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTool, setCurrentTool] = useState<ITool>();
  const [md, setMd] = useState<string>();

  useEffect(() => {
    setHeaderType(IHeaderType.minimal);
  }, []);

  useEffect(() => {
    const setup = async () => {
      const _currentTool = await getTool(name ?? "");
      if (!_currentTool) {
        navigate("/");
        return;
      }

      //Set the Tool content
      try {
        const file = await import(`@library/${_currentTool.name}/README.md`);
        const response = await fetch(file.default);
        const _md = await response.text();
        setMd(_md);
        setCurrentTool(_currentTool);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (e) {
        navigate("/");
        return;
      }
    };
    setup();
  }, [name, navigate]);

  if (isLoading || !md) {
    return <Loading />;
  }

  return (
    <>
      <Helmet>
        <title>{currentTool?.fancy_name} - HOUDINI</title>
        <meta name="description" content={currentTool?.description} />
      </Helmet>
      <h1 className="font-semibold">
        <Link className="text-sky-400 underline" to="/">
          ..
        </Link>{" "}
        /{currentTool?.fancy_name}
      </h1>

      {/* Quick Usage */}
      <h2>Quick Usage</h2>
      <p>For this tool the run command is:</p>

      <ClipboardCode fixedBtn>
        {replaceHoudiniVariables(currentTool?.run_command ?? "", toolbox)}
      </ClipboardCode>

      {/* Categories */}
      <h2>Categories</h2>
      <p>
        {currentTool?.categories.map((category: string) => {
          return (
            <span
              key={`category-${category}`}
              className="border-2 border-gray-300 text-gray-400 p-1 rounded m-1"
            >
              {category}
            </span>
          );
        })}
      </p>

      {/* Description & (optional) Cheatsheet */}
      <ReactMarkdown
        className="markdown-content"
        remarkPlugins={[gfm]}
        components={{
          pre({ node }) {
            const codeChild: any = node.children.find(
              (child: any) =>
                child.type === "element" && child.tagName === "code"
            );
            const code = codeChild.children[0].value;
            return (
              <ClipboardCode>
                {replaceHoudiniVariables(code, toolbox)}
              </ClipboardCode>
            );
          },
        }}
      >
        {md}
      </ReactMarkdown>

      {/* Reference */}
      <h2>Official Documentation</h2>
      <p>
        Reference:{" "}
        <a className="text-sky-400 underline" href={currentTool?.official_doc}>
          {currentTool?.official_doc}
        </a>
      </p>
    </>
  );
};

export default Tool;
