window.CASE_MODELS = [
  {
    "id": "dell-t330-tower",
    "manufacturer": "Dell",
    "name": "Dell T330 (tower)",
    "bays": 17,
    "description": "Dell T330 (tower) — 8x front hot-swap (vertical), 6x MB SATA, 3x PCIe usable",
    "layout": {
      "rows": 10,
      "cols": 6,
      "placeholderSlots": [
        { "id": 1,  "title": "Front hot-swap bays (8) — orientation: vertical" },
        { "id": 19, "title": "Motherboard SATA ports (6) — orientation: horizontal" },
        { "id": 31, "title": "PCIe slots (3 usable) — orientation: horizontal; slot 2 reserved" }
      ],
      "sepSlots": [1,2,3,4,5,6,19,20,21,22,23,24,31,32,33,34,35,36],
      "activeSlots": [
        7,8,9,10,13,14,15,16,
        25,26,27,28,29,30,
        37,49,55
      ]
    }
  },
  {
    "id": "mini-4",
    "manufacturer": "Generic",
    "name": "Mini Tower 4-bay",
    "bays": 4,
    "description": "Mini tower with 4 bays",
    "layout": {
      "cols":1,
      "rows": 4,
      "activeSlots": [1,2,3,4]
    }
  },
  {
    "id": "small-6",
    "manufacturer": "Generic",
    "name": "Compact 6-bay",
    "bays": 6,
    "description": "Compact 6-bay case",
    "layout": {
      "cols": 1,
      "rows": 6,
      "activeSlots": [1,2,3,4,5,6]
    }
  },
  {
    "id": "mid-8",
    "manufacturer": "Generic",
    "name": "Mid Tower 8-bay",
    "bays": 8,
    "description": "Mid-tower with 8 front bays",
    "layout": {
      "cols": 1,
      "rows": 8,
      "activeSlots": [1,2,3,4,5,6,7,8]
    }
  },
  {
    "id": "rack-12",
    "manufacturer": "Generic",
    "name": "Vertical rackmount 12-bay",
    "bays": 12,
    "description": "2U/3U rack chassis with 12 bays",
    "layout": {
      "cols": 12,
      "rows": 1,
      "activeSlots": [1,2,3,4,5,6,7,8,9,10,11,12]
    }
  },
  {
    "id": "phild13's multi-chassis-36bay",
    "manufacturer": "Generic",
    "name": "Phild13's multi-chassis-36bay",
    "bays": 36,
    "description": "24 slot backplane in front & 12 backplane rear",
    "layout": {
      "rows": 11,
      "activeSlots": [
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
        17, 18, 19, 20,
        21, 22, 23, 24,
        25, 26, 27, 28,
        33, 34, 35, 36,
        37, 38, 39, 40,
        41, 42, 43, 44
      ],
      "sepSlots": [ 1, 2, 3, 4,29, 30, 31, 32]
      ,"placeholderSlots": [
        {"id": 1, "title": "Front Bays"}
        , {"id": 29, "title": "Rear Bays"}
      ]
    }
  },
  {
    "id": "mini-8-h",
    "manufacturer": "Generic",
    "name": "Mini Tower 8-bay horizontal",
    "bays": 8,
    "description": "Mini Tower 8-bay horizontal",
    "layout": {
      "rows": 2,
      "cols": 8,
      "activeSlots": [9,10,11,12,13,14,15,16],
      "sepSlots": [1,2,3,4,5,6,7,8],
      "placeholderSlots": [
        {"id": 1, "title": "Front Bays"}
      ]
    }
  },
  {
    "id": "mini-8-v",
    "manufacturer": "Generic",
    "name": "Mini Tower 8-bay vertical",
    "bays": 8,
    "description": "Mini Tower 8-bay vertical",
    "layout": {
      "rotate": true,
      "rows": 2,
      "cols": 8,
      "activeSlots": [9,10,11,12,13,14,15,16],
      "sepSlots": [1,2,3,4,5,6,7,8],
      "placeholderSlots": [
        {"id": 1, "title": "Front Bays"}
      ]
    }
  },
{
    "id":"supermicro_12x4x2",
    "manufacturer": "Supermicro",
    "name": "Supermicro Case 12x4x2",
    "bays": 18,
    "description": "Supermicro Case 12x4x2 - by PhilD13",
    "layout": {
      "rows": 8,
      "cols": 4,
      "placeholderSlots": [
        {
          "id": 1,
          "title": "Front of Case - 12 Drives"
        },
        {
          "id": 17,
          "title": "Inside Top of Case - 4 drivess"
        },
        {
          "id": 25,
          "title": "Rear of Case - 2 Drives"
        }
      ],
      "sepSlots": [
        1,
        2,
        3,
        4,
        17,
        18,
        19,
        20,
        25,
        26,
        27,
        28
      ],
      "activeSlots": [
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        21,
        22,
        23,
        24,
        29,
        30
      ]
    }
  }  
];
