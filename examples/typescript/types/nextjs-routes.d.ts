// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
// This file will be automatically regenerated when your Next.js server is running.
/* eslint-disable */

// prettier-ignore
declare module "nextjs-routes" {
  export type Route =
    | { pathname: "/api/hello"; query?: Query | undefined }
    | { pathname: "/bars/[bar]"; query: Query<{ "bar": string }> }
    | { pathname: "/foos/[foo]"; query: Query<{ "foo": string }> }
    | { pathname: "/"; query?: Query | undefined };

  type Query<Params = {}> = Params & { [key: string]: string | string[] | undefined };

  type QueryForPathname = {
    [K in Route as K["pathname"]]: Exclude<K["query"], undefined>;
  };

  export type RoutedQuery<P extends Route["pathname"]> = QueryForPathname[P];

  /**
   * A typesafe utility function for generating paths in your application.
   *
   * route({ pathname: '/foos/[foo]', query: { foo: 'bar' }}) will produce '/foos/bar'.
   */
  export declare function route(r: Route): string;
}

// prettier-ignore
declare module "next/link" {
  import type { Route } from "nextjs-routes";
  import type { LinkProps as NextLinkProps } from "next/dist/client/link";
  import type { PropsWithChildren, MouseEventHandler } from "react";
  export * from "next/dist/client/link";

  type RouteOrQuery = Route | { query?: { [key: string]: string | string[] | undefined } };

  export interface LinkProps extends Omit<NextLinkProps, "href" | "locale"> {
    href: RouteOrQuery;
    locale?: false;
  }

  declare function Link(
    props: PropsWithChildren<LinkProps>
  ): DetailedReactHTMLElement<
    {
      onMouseEnter?: MouseEventHandler<Element> | undefined;
      onClick: MouseEventHandler;
      href?: string | undefined;
      ref?: any;
    },
    HTMLElement
  >;

  export default Link;
}

// prettier-ignore
declare module "next/router" {
  import type { Route, RoutedQuery } from "nextjs-routes";
  import type { NextRouter as Router } from "next/dist/client/router";
  export * from "next/dist/client/router";
  export { default } from "next/dist/client/router";

  type NextTransitionOptions = NonNullable<Parameters<Router["push"]>[2]>;

  interface TransitionOptions extends Omit<NextTransitionOptions, 'locale'> {
    locale?: false;
  };

  type RouteOrQuery = 
    | Route
    | { query: { [key: string]: string | string[] | undefined } };

  export interface NextRouter<P extends Route["pathname"] = Route["pathname"]>
    extends Omit<
      Router,
      "push" | "replace" | "locale" | "locales" | "defaultLocale" | "domainLocales"
    > {
    defaultLocale?: undefined;
    domainLocales?: undefined;
    locale?: undefined;
    locales?: undefined;
    pathname: P;
    push(
      url: RouteOrQuery,
      as?: string,
      options?: TransitionOptions
    ): Promise<boolean>;
    query: RoutedQuery<P>;
    replace(
      url: RouteOrQuery,
      as?: string,
      options?: TransitionOptions
    ): Promise<boolean>;
    route: P;
  }

  export function useRouter<P extends Route["pathname"]>(): NextRouter<P>;
}
