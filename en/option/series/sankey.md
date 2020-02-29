
{{target: series-sankey}}

# series.sankey(Object)

** Sankey diagram **

Sankey diagram is a specific type of streamgraphs(can also be seen as a directed acyclic graph). In which the width of each branch is shown proportionally to the flow quantity. These graphs are typically used to visualize energy or material or cost transfers between processes. They can also visualize the energy accounts, material flow accounts on a regional or national level, and also the breakdown of cost of item or services.

**Example: **

~[700x580](${galleryViewPath}sankey-energy&edit=1&reset=1)


<br>
**Visual Encoding: **

The Sankey diagram encodes each `node` of the raw data into a small rectangular. And different nodes are presented in different colors as far as possible. The `label` next to the small rectangular, which encoding the name of the node.

In addition, the edge between two small rectangulars in the diagram encoding the `link` of the raw data. The width of edge is shown proportionally to the `value` of `link`.



## type(string) = 'sankey'

{{use: partial-component-id(prefix="#")}}

{{ use: partial-rect-layout-width-height(
    componentName='sankey',
    defaultLeft: '5%',
    defaultRight: '20%',
    defaultTop: '5%',
    defaultBottom: '5%',
    defaultWidth: 'null',
    defaultHeight: 'null'
) }}


## nodeWidth(number) = 20

The node width of rectangle in Sankey diagram.


## nodeGap(number) = 8

The gap between any two regtangles in each column of the Sankey diagram.


## layoutIterations(number) = 32

The iterations of layout, which is used to iteratively optimize the position of the nodes and edges in the Sankey diagram to reduce the overlapping between nodes and edges. The default value is `32`. If you want the order of the nodes in the chart to be the same with the order in the original [data](~series-sankey.data), you can set the value to be `0`.

## orient(string) = 'horizontal,vertical'

The layout direction of the nodes in the Sankey diagram, which can be horizontal from left to right or vertical from top to bottom. The corresponding parameter values ​​are `horizontal` or `vertical`.

## draggable(boolean) = true

The drag-and-drop interaction of the node, which is enabled by default. After opening, the user can drag any node in the Sankey diagram to any position. To turn this interaction off, simply set the value to `false`.

## focusNodeAdjacency(boolean|string) = 'allEdges,outEdges,inEdges'

Support when mouse hovering over a node or an edge, the adjacent nodes and edges are also highlighted. Default off, can be manually opened.

Optional values:

+ `false`: When hovering over a node or an edge, only the hovered node or edge is highlighted.
+ `true`: the same as `'allEdges'`.
+ `'allEdges'`: When hovering over a node, all of the adjacent edges and nodes are highlighted. When hovering over an edge, the adjacent nodes are highlighted.
+ `'outEdges'`: When hovering over a node, the outcoming edges and its adjacent nodes are highlighted. When hovering over an edge, the adjacent nodes are highlighted.
+ `'inEdges'`: When hovering over a node, the incoming edges and its adjacent nodes are highlighted. When hovering over an edge, the adjacent nodes are highlighted.


## levels(Array)

The setting of each layer of Sankey diagram. Can be set layer by layer, as follows:

```js
levels: [{
    depth: 0,
    itemStyle: {
        color: '#fbb4ae'
    },
    lineStyle: {
        color: 'source',
        opacity: 0.6
    }
}, {
    depth: 1,
    itemStyle: {
        color: '#b3cde3'
    },
    lineStyle: {
        color: 'source',
        opacity: 0.6
    }
}]
```

You can also only set a certain layer:

```js
levels: [{
    depth: 3,
    itemStyle: {
        color: '#fbb4ae'
    },
    lineStyle: {
        color: 'source',
        opacity: 0.6
    }
}]
```

### depth(number)

Specify which layer is set, value starts from 0.

### itemStyle(Object)

Specify the node style of the specific layer.

{{use:partial-item-style(prefix="###", useColorPalatte=true)}}

### lineStyle(Object)

Specify the outEdge style of the specific layer. in which [lineStyle.color](~series-sankey.lineStyle.color) can be assigned to the value of `'source'` of `'target'`, then the OutEdge will automatically take the source node or target node color as its own color.

{{use: partial-sankey-line-style(prefix="###")}}


## label(Object)

`label` describes the text label style in each rectangular node.

{{use:partial-label(
    prefix="##",
    defaultShowLabel=true,
    defaultPosition="'right'",
    formatter1d=true
)}}

## itemStyle(Object)

The style of node rectangle in Sankey diagram.

{{use: partial-item-style(
    prefix="##",
    useColorPalatte=true,
    defaultBorderWidth=1,
    defaultBorderColor="'#aaa'"
)}}


## lineStyle(Object)

The edge style of Sankey diagram, in which [lineStyle.color](~series-sankey.lineStyle.color) can be assigned to the value of `'source'` of `'target'`, then the edge will automatically take the source node or target node color as its own color.

{{use: partial-sankey-line-style(prefix="##")}}


## emphasis(Object)
### label(Object)
{{use:partial-label(
    prefix="###",
    formatter1d=true
)}}
### itemStyle(Object)
{{use: partial-item-style(prefix="###")}}
### lineStyle(Object)
{{use: partial-sankey-line-style(
    prefix="###"
)}}


## data(Array)

The nodes list of the sankey diagram.

```js
data: [{
    name: 'node1',
    // This attribute decides the layer of the current node.
    depth: 0
}, {
    name: 'node2',
    depth: 1
}]
```

**Notice:** The name of the node cannot be repeated.

### name(string)

The name of the node.

### value(number)

The value of the node, which can used to determine the height of the node in horizontal orient or width in the vertical orient.

### depth(number)

The layer of the node, value starts from 0.

### itemStyle(Object)

The style of this node.
{{use:partial-item-style(prefix="###", useColorPalatte=true)}}

### label(Object)

The lable style of this node.
{{ use:partial-label(
    prefix="###"
) }}

### emphasis(Object)

#### itemStyle(Object)

{{use:partial-item-style(prefix="####")}}

#### label(Object)

{{ use:partial-label(
    prefix="####"
) }}

{{use: partial-tooltip-in-series-data(
    galleryViewPath=${galleryViewPath}
)}}


## nodes(Array)

Equals to [data](~series-sankey.data)

## links(Array)

The links between nodes. **Notes: The Sankey diagram theoretically only supports Directed Acyclic Graph(DAG), so please make sure that there is no cycle in the links.** For instance:

```js
links: [{
    source: 'n1',
    target: 'n2'
}, {
    source: 'n2',
    target: 'n3'
}]
```

### source(string)

The [name of source node](~series-sankey.data.name) of edge

### target(string)

The [name of target node](~series-sankey.data.name) of edge

### value(number)

The value of edge, which decides the width of edge.

### lineStyle(Object)

The line stlye of edge.
{{use:partial-sankey-line-style(
    prefix="###"
)}}

### emphasis(Object)

#### lineStyle(Object)

{{ use:partial-sankey-line-style(
    prefix="####"
) }}

## edges(Array)

Equals to [links](~series-sankey.links)

{{ use:partial-silent(
    prefix="#"
)}}

{{use: partial-animation(
    prefix="#",
    defaultAnimationEasing="'linear'",
    defaultAnimationDuration=1000,
    galleryEditorPath=${galleryEditorPath}
)}}


{{use: partial-tooltip-in-series(
    galleryViewPath=${galleryViewPath}
)}}


{{target: partial-sankey-line-style}}

#${prefix} color(Color) = "'#314656'"

The color of the edge in Sankey diagram.

#${prefix} opacity(number) = 0.2

The opacity of the edge in Sankey diagram.

#${prefix} curveness(number) = 0.5

The curveness of the edge in Sankey diagram.

{{use: partial-style-shadow(prefix=${prefix})}}
