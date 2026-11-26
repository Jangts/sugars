# 3D Pictures

`@sugars/3d-pictures` 移植自 TangramJS `ThreeDimensionalEyes` 和 `Photos`。水平拖动切换物件的连拍帧，按顺序形成旋转效果。

```ts
import { Pictures3D } from '@sugars/3d-pictures'

const stage = document.createElement('div')
Object.assign(stage.style, {
    width: '240px', height: '240px', backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
})
document.body.append(stage)
const pictures = new Pictures3D(stage, ['/frames/01.webp', '/frames/02.webp', '/frames/03.webp'])
await pictures.loading()
// 不再使用时调用 pictures.destroy()
```

第二个构造参数可传 URL 数组、图片目录配置 `{ imagePath, totalImages, imageExtension, defaultImageNumber }` 或返回 URL 数组的 JSON 清单地址。目录中的文件从 1 编号，初始帧索引从 0 开始。清单的相对图片地址以清单地址为基准，`ready` 可等待清单解析完成。

保留点击预载条开始装载的入口，也可主动调用 `loading()`。直接在容器内提供 `img.ib-3deyes-item` 并省略第二个参数时，可以直接拖动。鼠标和触摸共用拖动逻辑，移动距离每超过 25 像素切换一帧，首尾循环。也可以写入零基的 `cur` 切换当前帧。`ThreeDimensionalEyes` 是 `Pictures3D` 的别名。
