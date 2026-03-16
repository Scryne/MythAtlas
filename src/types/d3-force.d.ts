declare module 'd3-force' {
  export interface SimulationNodeDatum {
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
  }

  export interface SimulationLinkDatum<NodeDatum extends SimulationNodeDatum> {
    source: string | NodeDatum;
    target: string | NodeDatum;
    index?: number;
  }

  export function forceSimulation<NodeDatum extends SimulationNodeDatum>(
    nodes?: NodeDatum[]
  ): any;

  export function forceLink<
    NodeDatum extends SimulationNodeDatum,
    LinkDatum extends SimulationLinkDatum<NodeDatum>
  >(links?: LinkDatum[]): any;

  export function forceManyBody(): any;
  export function forceCenter(x?: number, y?: number): any;
  export function forceCollide<NodeDatum extends SimulationNodeDatum>(): any;
}
