declare module 'topojson-client' {
  // Tipagem mínima para uso no app (extração de GeoJSON a partir de TopoJSON).
  // Mantido propositalmente simples para evitar conflitos com moduleResolution=bundler.
  export function feature(topology: any, object: any): any
}
