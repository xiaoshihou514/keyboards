# SPLIT · 58 — Three.js 键盘复刻

用 Three.js 程序化复刻我的手焊分体键盘（58 键、列错排、透明矮轴帽、每键 RGB 底光）。

![参考](real/)

## 运行

需要通过 HTTP 服务访问（ES Module 限制，直接双击 html 打不开）：

```bash
python3 -m http.server 8123
# 打开 http://127.0.0.1:8123/
```

## 交互

- **拖动** 旋转视角，**滚轮** 缩放
- **点击 3D 键帽** 触发按压动画 + RGB 涟漪
- **直接敲你的真键盘** —— 按 `event.code` 映射，对应键会下沉并发光
- **LAYER 0/1/2** —— 切换键帽图例（数据来自 VIA 截图逐层转录）
- **RGB** —— wave / reactive / static / off 四种灯效
- **ROTATE** —— 自动旋转展示
- **DEMO TYPE** —— 自动打字演示

## 结构

- `js/layout.js` —— 布局数据：3 层 VIA 键位、外壳轮廓多边形、盖板/铜螺母位置
- `js/keyboard.js` —— 建模：3D 打印纹理外壳、透明键帽(transmission)、轴体、图例纹理、RGB 灯
- `js/main.js` —— 场景、Bloom 后期、灯效、按压/涟漪动画、交互

## 调试

- `?shot=1` —— 确定性截图模式（关闭自动旋转/打字，固定时间轴）
