import { existsSync, mkdirSync, writeFileSync } from "fs";
import { I18NConfig } from "next/dist/server/config-shared.js";
import { join, parse, sep } from "path";
import { findFiles, getAppDirectory, getPagesDirectory } from "./utils.js";

// import assertions are not yet supported by babel out of the box but are required
// by node 17+
// import pkg from "../package.json" assert { type: "json" };
const pkg = {
  version: "2.0.1",
};

type QueryType = "dynamic" | "catch-all" | "optional-catch-all";

interface Route {
  pathname: string;
  query: Record<string, QueryType>;
}

function convertWindowsPathToUnix(file: string): string {
  return file.replace(/\\/g, "/");
}

export function nextRoutes(pathnames: string[]): Route[] {
  const DYNAMIC_SEGMENT_RE = /\[(.*?)\]/g;

  return pathnames.map((pathname) => {
    const segments: string[] = pathname.match(DYNAMIC_SEGMENT_RE) ?? [];
    const query = segments.reduce<Route["query"]>((acc, cur) => {
      const param = cur
        .replace(/\[/g, "")
        .replace(/\]/g, "")
        .replace("...", "");
      let queryType: QueryType = "dynamic";
      if (cur.startsWith("[[")) {
        queryType = "optional-catch-all";
      } else if (cur.startsWith("[...")) {
        queryType = "catch-all";
      }
      acc[param] = queryType;
      return acc;
    }, {});

    return {
      pathname,
      query,
    };
  });
}

function getQueryInterface(
  query: Route["query"],
): [query: string, requiredKeys: number] {
  let requiredKeys = 0;
  const keys = Object.entries(query)
    .map(([key, value]) => {
      switch (value) {
        case "dynamic": {
          requiredKeys += 1;
          return `"${key}": string`;
        }
        case "catch-all": {
          requiredKeys += 1;
          return `"${key}": string[]`;
        }
        case "optional-catch-all": {
          return `"${key}"?: string[] | undefined`;
        }
        // istanbul ignore next
        default: {
          const _exhaust: never = value;
          return _exhaust;
        }
      }
    })
    .join("; ");

  return [`{ ${keys} }`, requiredKeys];
}

function generate(routes: Route[], config: NextJSRoutesOptions): string {
  const i18n = config.i18n ?? {
    defaultLocale: "",
    domains: [],
    localeDetection: false,
    locales: [],
  };
  return `\
// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
// This file will be automatically regenerated when your Next.js server is running.
// nextjs-routes version: ${pkg.version}
/* eslint-disable */

// prettier-ignore
declare module "nextjs-routes" {
  import type {
    GetServerSidePropsContext as NextGetServerSidePropsContext,
    GetServerSidePropsResult as NextGetServerSidePropsResult
  } from "next";

  export type Route =
    ${
      !routes.length
        ? "never"
        : `| ${routes
            .map((route) => {
              const [params, requiredKeys] = getQueryInterface(route.query);
              return requiredKeys > 0
                ? `DynamicRoute<"${route.pathname}", ${params}>`
                : `StaticRoute<"${route.pathname}">`;
            })
            .join("\n    | ")}`
    };

  interface StaticRoute<Pathname> {
    pathname: Pathname;
    query?: Query | undefined;
    hash?: string | null | undefined;
  }

  interface DynamicRoute<Pathname, Parameters> {
    pathname: Pathname;
    query: Parameters & Query;
    hash?: string | null | undefined;
  }

  interface Query {
    [key: string]: string | string[] | undefined;
  };

  export type RoutedQuery<P extends Route["pathname"]> = Extract<
    Route,
    { pathname: P }
  >["query"];

  export type Locale = ${
    !i18n.locales.length
      ? "undefined"
      : `\n    | ${i18n.locales.map((x) => `"${x}"`).join("\n    | ")}`
  };

  /**
   * A typesafe utility function for generating paths in your application.
   *
   * route({ pathname: "/foos/[foo]", query: { foo: "bar" }}) will produce "/foos/bar".
   */
  export declare function route(r: Route): string;

  /**
   * Nearly identical to GetServerSidePropsContext from next, but further narrows
   * types based on nextjs-route's route data.
   */
  export type GetServerSidePropsContext<
    Pathname extends Route["pathname"] = Route["pathname"],
    Preview extends NextGetServerSidePropsContext["previewData"] = NextGetServerSidePropsContext["previewData"]
  > = Omit<NextGetServerSidePropsContext, 'params' | 'query' | 'defaultLocale' | 'locale' | 'locales'> & {
    params: Extract<Route, { pathname: Pathname }>["query"];
    query: Query;
    defaultLocale${
      i18n.defaultLocale ? `: "${i18n.defaultLocale}"` : "?: undefined"
    };
    locale${!i18n.locales.length ? "?:" : ":"} Locale;
    locales${
      i18n.locales.length ? `: ${print(i18n.locales, 8)}` : "?: undefined"
    };
  };

  /**
   * Nearly identical to GetServerSideProps from next, but further narrows
   * types based on nextjs-route's route data.
   */
  export type GetServerSideProps<
    Props extends { [key: string]: any } = { [key: string]: any },
    Pathname extends Route["pathname"] = Route["pathname"],
    Preview extends NextGetServerSideProps["previewData"] = NextGetServerSideProps["previewData"]
  > = (
    context: GetServerSidePropsContext<Pathname, Preview>
  ) => Promise<NextGetServerSidePropsResult<Props>>
}

// prettier-ignore
declare module "next/link" {
  import type { Route } from "nextjs-routes";
  import type { LinkProps as NextLinkProps } from "next/dist/client/link";
  import type {
    AnchorHTMLAttributes,
    DetailedReactHTMLElement,
    MouseEventHandler,
    PropsWithChildren,
  } from "react";
  export * from "next/dist/client/link";

  type StaticRoute = Exclude<Route, { query: any }>["pathname"];

  export interface LinkProps
    extends Omit<NextLinkProps, "href" | "locale">,
      AnchorHTMLAttributes<HTMLAnchorElement> {
    href: Route | StaticRoute | Omit<Route, "pathname">
    locale?: ${!i18n.locales.length ? "false" : `Locale | false`};
  }

  type LinkReactElement = DetailedReactHTMLElement<
    {
      onMouseEnter?: MouseEventHandler<Element> | undefined;
      onClick: MouseEventHandler;
      href?: string | undefined;
      ref?: any;
    },
    HTMLElement
  >;

  declare function Link(props: PropsWithChildren<LinkProps>): LinkReactElement;

  export default Link;
}

// prettier-ignore
declare module "next/router" {
  import type { Locale, Route, RoutedQuery } from "nextjs-routes";
  import type { NextRouter as Router } from "next/dist/client/router";
  export * from "next/dist/client/router";
  export { default } from "next/dist/client/router";

  type NextTransitionOptions = NonNullable<Parameters<Router["push"]>[2]>;
  type StaticRoute = Exclude<Route, { query: any }>["pathname"];

  interface TransitionOptions extends Omit<NextTransitionOptions, "locale"> {
    locale?: ${!i18n.locales.length ? "false" : `Locale | false`};
  }

  type PathnameAndQuery<Pathname> = Required<
    Pick<Extract<Route, { pathname: Pathname }>, "pathname" | "query">
  >;

  type AutomaticStaticOptimizedQuery<PaQ> = Omit<PaQ, "query"> & {
    query: Partial<PaQ["query"]>;
  };

  type BaseRouter<PaQ> =
    | ({ isReady: false } & AutomaticStaticOptimizedQuery<PaQ>)
    | ({ isReady: true } & PaQ);

  export type NextRouter<P extends Route["pathname"] = Route["pathname"]> =
    BaseRouter<PathnameAndQuery<P>> &
      Omit<
        Router,
        | "defaultLocale"
        | "domainLocales"
        | "isReady"
        | "locale"
        | "locales"
        | "pathname"
        | "push"
        | "query"
        | "replace"
        | "route"
      > & {
        defaultLocale${
          i18n.defaultLocale ? `: "${i18n.defaultLocale}"` : "?: undefined"
        };
        domainLocales${
          i18n.domains?.length ? `: ${print(i18n.domains, 8)}` : "?: undefined"
        };
        locale${!i18n.locales.length ? "?:" : ":"} Locale;
        locales${
          i18n.locales.length ? `: ${print(i18n.locales, 8)}` : "?: undefined"
        };
        push(
          url: Route | StaticRoute | Omit<Route, "pathname">,
          as?: string,
          options?: TransitionOptions
        ): Promise<boolean>;
        replace(
          url: Route | StaticRoute | Omit<Route, "pathname">,
          as?: string,
          options?: TransitionOptions
        ): Promise<boolean>;
        route: P;
      };

  export function useRouter<P extends Route["pathname"]>(): NextRouter<P>;
}
`;
}

function print(x: unknown, indent: number): string {
  return JSON.stringify(x, undefined, 2)
    .split("\n")
    .join("\n" + " ".repeat(indent));
}

export const logger: Pick<Console, "error"> = {
  error: (str: string) => console.error("[nextjs-routes] " + str),
};

export interface NextJSRoutesOptions {
  /**
   * The file path indicating the output directory where the generated route types
   * should be written to (e.g.: "types").
   */
  outDir?: string | undefined;
  /**
   * Location of the Next.js project. Defaults to the current working directory.
   *
   * This is only necessary when working with a non standard NextJS project setup, such as Nx.
   *
   * Example:
   *
   * // next.config.js
   * const nextRoutes = require("nextjs-routes/config")
   * const withRoutes = nextRoutes({ dir: __dirname });
   */
  dir?: string | undefined;
  /**
   * NextJS config option.
   * https://nextjs.org/docs/api-reference/next.config.js/custom-page-extensions
   */
  pageExtensions?: string[] | undefined;
  /**
   * Internationalization configuration
   *
   * @see [Internationalization docs](https://nextjs.org/docs/advanced-features/i18n-routing)
   */
  i18n?: I18NConfig | null | undefined;
}

interface Opts {
  pageExtensions: string[];
  directory: string;
}

function commonProcessing(paths: string[], opts: Opts): string[] {
  return (
    paths
      // filter page extensions
      .filter((file) => {
        return opts.pageExtensions.some((ext) => file.endsWith(ext));
      })
      // remove file extensions (.tsx, .test.tsx)
      .map((file) => file.replace(/(\.\w+)+$/, ""))
      // remove duplicates from file extension removal (eg foo.ts and foo.test.ts)
      .filter((file, idx, array) => array.indexOf(file) === idx)
      // remove page directory path
      .map((file) => file.replace(opts.directory, ""))
      // normalize paths from windows users
      .map(convertWindowsPathToUnix)
  );
}

const APP_DIRECTORY_ROUTABLE = ["page", "route"];

export function getAppRoutes(files: string[], opts: Opts): string[] {
  return (
    commonProcessing(files, opts)
      // app pages must be named 'page'
      .filter((file) => APP_DIRECTORY_ROUTABLE.includes(parse(file).name))
      .map((file) =>
        // transform filepath to url path
        file
          .split(sep)
          // remove named groups
          .filter(
            (segment) => !(segment.startsWith("(") && segment.endsWith(")")),
          )
          // remove page
          .filter((file) => !APP_DIRECTORY_ROUTABLE.includes(parse(file).name))
          .join(sep),
      )
      // handle index page
      .map((file) => (file === "" ? "/" : file))
  );
}

const NEXTJS_NON_ROUTABLE = ["/_app", "/_document", "/_error", "/middleware"];

export function getPageRoutes(files: string[], opts: Opts): string[] {
  return (
    commonProcessing(files, opts)
      // remove index if present (/foos/index.ts is the same as /foos.ts)
      .map((file) => file.replace(/index$/, ""))
      // remove trailing slash if present
      .map((file) =>
        file.endsWith("/") && file.length > 2 ? file.slice(0, -1) : file,
      )
      // exclude nextjs special routes
      .filter((file) => !NEXTJS_NON_ROUTABLE.includes(file))
  );
}

export function writeNextJSRoutes(options: NextJSRoutesOptions): void {
  const defaultOptions = {
    dir: process.cwd(),
    outDir: join(options.dir ?? process.cwd(), "@types"),
    pageExtensions: ["tsx", "ts", "jsx", "js"],
  };
  const opts = {
    ...defaultOptions,
    ...options,
  };
  const files = [];
  const pagesDirectory = getPagesDirectory(opts.dir);
  if (pagesDirectory) {
    const routes = getPageRoutes(findFiles(pagesDirectory), {
      pageExtensions: opts.pageExtensions,
      directory: pagesDirectory,
    });
    files.push(...routes);
  }
  const appDirectory = getAppDirectory(opts.dir);
  if (appDirectory) {
    const routes = getAppRoutes(findFiles(appDirectory), {
      pageExtensions: opts.pageExtensions,
      directory: appDirectory,
    });
    files.push(...routes);
  }
  const outputFilepath = join(opts.outDir, "nextjs-routes.d.ts");
  if (opts.outDir && !existsSync(opts.outDir)) {
    mkdirSync(opts.outDir, { recursive: true });
  }
  const routes = nextRoutes(files);
  const generated = generate(routes, opts);
  writeFileSync(outputFilepath, generated);
}
