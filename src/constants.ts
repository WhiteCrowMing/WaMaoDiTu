export interface Region {
  id: string;
  name: string;
  description: string;
  path: string; // SVG 路径数据 (归一化 0-1000)
  center?: { x: number, y: number }; // 用于点位按键的中心坐标
  imageUrl?: string; // 用户上传的图片
}

export const regions: Region[] = [
  {
    "id": "region-1775124629462",
    "name": "大理市",
    "description": "暂无详细描述",
    "path": "",
    "center": {
      "x": 427.90478200134305,
      "y": 438.74909363114784
    },
    "imageUrl": "/4.jpg"
  },
  {
    "id": "region-1775125299627",
    "name": "大理鹤庆",
    "description": "暂无详细描述",
    "path": "",
    "center": {
      "x": 432.67583415247924,
      "y": 379.1961684405637
    },
    "imageUrl": "/5.jpg"
  },
  {
    "id": "region-1775125342413",
    "name": "丽江永胜",
    "description": "暂无详细描述",
    "path": "",
    "center": {
      "x": 468.83538729793196,
      "y": 374.9423880698077
    },
    "imageUrl": "/2.jpg"
  },
  {
    "id": "region-1775125504016",
    "name": "呈贡",
    "description": "暂无详细描述",
    "path": "",
    "center": {
      "x": 610.711411792243,
      "y": 554.4519197157111
    },
    "imageUrl": "/1.jpg"
  },
  {
    "id": "region-1775125676983",
    "name": "西山",
    "description": "暂无详细描述",
    "path": "",
    "center": {
      "x": 602.4248475297434,
      "y": 501.70504311833673
    },
    "imageUrl": "/6.jpg"
  },
  {
    "id": "region-1775125697654",
    "name": "盘龙",
    "description": "暂无详细描述",
    "path": "",
    "center": {
      "x": 613.2224918717882,
      "y": 502.1304211554123
    },
    "imageUrl": "/3.jpg"
  },
  {
    "id": "region-1775125898953",
    "name": "文山",
    "description": "暂无详细描述",
    "path": "",
    "center": {
      "x": 681.0216540195121,
      "y": 678.0384152923405
    },
    "imageUrl": "/7.jpg"
  },
  {
    "id": "region-1775125939204",
    "name": "玉溪",
    "description": "暂无详细描述",
    "path": "",
    "center": {
      "x": 590.6227711558804,
      "y": 617.8332472399757
    },
    "imageUrl": "/8.jpg"
  },
  {
    "id": "region-1775125954863",
    "name": "楚雄",
    "description": "暂无详细描述",
    "path": "",
    "center": {
      "x": 500.6465878738511,
      "y": 568.7714549970784
    },
    "imageUrl": "/9.jpg"
  },
  {
    "id": "region-1775125969200",
    "name": "麒麟",
    "description": "暂无详细描述",
    "path": "",
    "center": {
      "x": 689.8104342979208,
      "y": 500.4289090071099
    },
    "imageUrl": "/10.jpg"
  }
];
