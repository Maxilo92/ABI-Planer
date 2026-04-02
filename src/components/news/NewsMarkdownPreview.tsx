'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface NewsMarkdownPreviewProps {
  content: string
  title?: string
  imageUrl?: string
}

export function NewsMarkdownPreview({ content, title, imageUrl }: NewsMarkdownPreviewProps) {
  return (
    <div className="space-y-6">
      {imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted border border-border/20">
          <img
            src={imageUrl}
            alt="Titelbild Vorschau"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      
      <div className="space-y-4">
        {title && (
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-foreground border-b pb-4">
            {title}
          </h2>
        )}

        <ReactMarkdown
          className="text-sm md:text-base text-foreground/90 leading-relaxed max-w-none prose dark:prose-invert"
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
            li: ({ children, ...props }) => {
              const isTask = (props as any).checked !== undefined;
              return (
                <li className={isTask ? 'list-none flex items-start gap-2 -ml-6' : 'pl-1'}>
                  {children}
                </li>
              );
            },
            h1: ({ children }) => <h1 className="text-2xl font-black mb-4 mt-8">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-6">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground bg-primary/5 py-2">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="my-8 border-border/50" />,
            a: ({ href, children }) => (
              <span className="text-primary underline decoration-primary/30 underline-offset-4">
                {children}
              </span>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-6 rounded-lg border">
                <table className="w-full text-xs border-collapse">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
            th: ({ children }) => <th className="p-2 text-left font-bold border-b">{children}</th>,
            td: ({ children }) => <td className="p-2 border-b border-muted/30">{children}</td>,
            code: ({ className, children }) => {
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !match;
              return isInline ? (
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary-foreground/90">{children}</code>
              ) : (
                <pre className="bg-zinc-950 p-3 rounded-lg overflow-x-auto my-4 border border-white/5 shadow-lg">
                  <code className={`${className} text-xs font-mono text-zinc-100`}>{children}</code>
                </pre>
              );
            },
            input: ({ checked }) => (
              <input 
                type="checkbox" 
                checked={checked} 
                readOnly 
                className="h-3.5 w-3.5 mt-1 rounded border-primary text-primary focus:ring-primary"
              />
            ),
            del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
          }}
        >
          {content || '*Noch kein Inhalt...*'}
        </ReactMarkdown>
      </div>
    </div>
  )
}
