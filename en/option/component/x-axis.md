
{{target: component-x-axis}}

# xAxis(Object)

The x axis in cartesian(rectangular) coordinate. Usually a single grid component can place at most 2 x axis, one on the bottom and another on the top. [offset](~xAxis.offset) can be used to avoid overlap when you need to put more than two x axis.


{{use: partial-component-id(prefix="#")}}

## show(boolean) = true

Set this to `false` to prevent the axis from showing.

## gridIndex(number) = 0

The index of grid which the x axis belongs to. Defaults to be in the first grid.

## position(string) = 'top,bottom'

The position of x axis.

options:
+ `'top'`
+ `'bottom'`

The first x axis in grid defaults to be on the bottom of the grid, and the second x axis is on the other side against the first x axis.


## offset(number) = 0

Offset of x axis relative to default position. Useful when multiple x axis has same [position](~xAxis.position) value.


{{ use: axis-common(
    prefix='#',
    componentType='xAxis',
    axisTypeDefault="'category'",
    hasSplitLineAndArea=true,
    galleryViewPath=${galleryViewPath},
    galleryEditorPath=${galleryEditorPath}
)}}


{{use:partial-z-zlevel(
    prefix="#",
    componentName="x axis",
    defaultZ=0
) }}