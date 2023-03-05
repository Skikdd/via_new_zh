import {
  advancedKeycodeToString,
  advancedStringToKeycode,
} from './advanced-keys';
import {
  BuiltInKeycodeModule,
  VIADefinitionV3,
  VIADefinitionV2,
  getLightingDefinition,
  KeycodeType,
} from '@the-via/reader';

export interface IKeycode {
  name: string;
  code: string;
  title?: string;
  shortName?: string;
  keys?: string;
  width?: number;
  type?: 'container' | 'text' | 'layer';
  layer?: number;
}

export interface IKeycodeMenu {
  label: string;
  keycodes: IKeycode[];
  width?: 'label';
  detailed?: string;
}

// Tests if label is an alpha
export function isAlpha(label: string) {
  return /[A-Za-z]/.test(label) && label.length === 1;
}

// Test if label is a numpad number
export function isNumpadNumber(label: string) {
  return /['0-9]/.test(label) && label.length === 1;
}

export function isArrowKey(label: string) {
  return /[🠗🠕🠖🠔←↑→↓]$/.test(label);
}

export function isNumpadSymbol(label: string) {
  const centeredSymbol = '-+.÷×'.split('');
  return label.length === 1 && centeredSymbol.includes(label[0]);
}

// Test if label is a multi-legend, e.g. "!\n1"
export function isMultiLegend(label: string) {
  const topLegend = '~!@#$%^&*()_+|{}:"<>?'.split('');
  return label.length !== 1 && topLegend.includes(label[0]);
}

// Tests if label is a number
export function isNumericOrShiftedSymbol(label: string) {
  const numbersTop = '!@#$%^&*()_+|~{}:"<>?1234567890'.split('');
  return label.length === 1 && numbersTop.includes(label[0]);
}

// Tests if label is a number
export function isNumericSymbol(label: string) {
  const numbersTop = '!@#$%^&*()_+|~{}:"<>?'.split('');
  return label.length !== 1 && numbersTop.includes(label[0]);
}

// Maps the byte value to the keycode
export function getByteForCode(
  code: string,
  basicKeyToByte: Record<string, number>,
) {
  const byte: number | undefined = basicKeyToByte[code];
  if (byte !== undefined) {
    return byte;
  } else if (isLayerCode(code)) {
    return getByteForLayerCode(code, basicKeyToByte);
  } else if (advancedStringToKeycode(code, basicKeyToByte) !== null) {
    return advancedStringToKeycode(code, basicKeyToByte);
  }
  throw `Could not find byte for ${code}`;
}

function isLayerCode(code: string) {
  return /([A-Za-z]+)\((\d+)\)/.test(code);
}

function getByteForLayerCode(
  keycode: string,
  basicKeyToByte: Record<string, number>,
): number {
  const keycodeMatch = keycode.match(/([A-Za-z]+)\((\d+)\)/);
  if (keycodeMatch) {
    const [, code, layer] = keycodeMatch;
    const numLayer = parseInt(layer);
    switch (code) {
      case 'TO': {
        return Math.min(
          basicKeyToByte._QK_TO + numLayer,
          basicKeyToByte._QK_TO_MAX,
        );
      }
      case 'MO': {
        return Math.min(
          basicKeyToByte._QK_MOMENTARY + numLayer,
          basicKeyToByte._QK_MOMENTARY_MAX,
        );
      }
      case 'DF': {
        return Math.min(
          basicKeyToByte._QK_DEF_LAYER + numLayer,
          basicKeyToByte._QK_DEF_LAYER_MAX,
        );
      }
      case 'TG': {
        return Math.min(
          basicKeyToByte._QK_TOGGLE_LAYER + numLayer,
          basicKeyToByte._QK_TOGGLE_LAYER_MAX,
        );
      }
      case 'OSL': {
        return Math.min(
          basicKeyToByte._QK_ONE_SHOT_LAYER + numLayer,
          basicKeyToByte._QK_ONE_SHOT_LAYER_MAX,
        );
      }
      case 'TT': {
        return Math.min(
          basicKeyToByte._QK_LAYER_TAP_TOGGLE + numLayer,
          basicKeyToByte._QK_LAYER_TAP_TOGGLE_MAX,
        );
      }
      case 'CUSTOM': {
        return Math.min(
          basicKeyToByte._QK_KB + numLayer,
          basicKeyToByte._QK_KB_MAX,
        );
      }
      case 'MACRO': {
        return Math.min(
          basicKeyToByte._QK_MACRO + numLayer,
          basicKeyToByte._QK_MACRO_MAX,
        );
      }
      default: {
        throw new Error('Incorrect code');
      }
    }
  }
  throw new Error('No match found');
}

function getCodeForLayerByte(
  byte: number,
  basicKeyToByte: Record<string, number>,
) {
  if (basicKeyToByte._QK_TO <= byte && basicKeyToByte._QK_TO_MAX >= byte) {
    const layer = byte - basicKeyToByte._QK_TO;
    return `TO(${layer})`;
  } else if (
    basicKeyToByte._QK_MOMENTARY <= byte &&
    basicKeyToByte._QK_MOMENTARY_MAX >= byte
  ) {
    const layer = byte - basicKeyToByte._QK_MOMENTARY;
    return `MO(${layer})`;
  } else if (
    basicKeyToByte._QK_DEF_LAYER <= byte &&
    basicKeyToByte._QK_DEF_LAYER_MAX >= byte
  ) {
    const layer = byte - basicKeyToByte._QK_DEF_LAYER;
    return `DF(${layer})`;
  } else if (
    basicKeyToByte._QK_TOGGLE_LAYER <= byte &&
    basicKeyToByte._QK_TOGGLE_LAYER_MAX >= byte
  ) {
    const layer = byte - basicKeyToByte._QK_TOGGLE_LAYER;
    return `TG(${layer})`;
  } else if (
    basicKeyToByte._QK_ONE_SHOT_LAYER <= byte &&
    basicKeyToByte._QK_ONE_SHOT_LAYER_MAX >= byte
  ) {
    const layer = byte - basicKeyToByte._QK_ONE_SHOT_LAYER;
    return `OSL(${layer})`;
  } else if (
    basicKeyToByte._QK_LAYER_TAP_TOGGLE <= byte &&
    basicKeyToByte._QK_LAYER_TAP_TOGGLE_MAX >= byte
  ) {
    const layer = byte - basicKeyToByte._QK_LAYER_TAP_TOGGLE;
    return `TT(${layer})`;
  } else if (
    basicKeyToByte._QK_KB <= byte &&
    basicKeyToByte._QK_KB_MAX >= byte
  ) {
    const n = byte - basicKeyToByte._QK_KB;
    return `CUSTOM(${n})`;
  } else if (
    basicKeyToByte._QK_MACRO <= byte &&
    basicKeyToByte._QK_MACRO_MAX >= byte
  ) {
    const n = byte - basicKeyToByte._QK_MACRO;
    return `MACRO(${n})`;
  }
}

export const keycodesList = getKeycodes().reduce<IKeycode[]>(
  (p, n) => p.concat(n.keycodes),
  [],
);

export const getByteToKey = (basicKeyToByte: Record<string, number>) =>
  Object.keys(basicKeyToByte).reduce((p, n) => {
    const key = basicKeyToByte[n];
    if (key in p) {
      const basicKeycode = keycodesList.find(({code}) => code === n);
      if (basicKeycode) {
        return {...p, [key]: basicKeycode.code};
      }
      return p;
    }
    return {...p, [key]: n};
  }, {} as {[key: number]: string});

function isLayerKey(byte: number, basicKeyToByte: Record<string, number>) {
  return [
    [basicKeyToByte._QK_TO, basicKeyToByte._QK_TO_MAX],
    [basicKeyToByte._QK_MOMENTARY, basicKeyToByte._QK_MOMENTARY_MAX],
    [basicKeyToByte._QK_DEF_LAYER, basicKeyToByte._QK_DEF_LAYER_MAX],
    [basicKeyToByte._QK_TOGGLE_LAYER, basicKeyToByte._QK_TOGGLE_LAYER_MAX],
    [basicKeyToByte._QK_ONE_SHOT_LAYER, basicKeyToByte._QK_ONE_SHOT_LAYER_MAX],
    [
      basicKeyToByte._QK_LAYER_TAP_TOGGLE,
      basicKeyToByte._QK_LAYER_TAP_TOGGLE_MAX,
    ],
    [basicKeyToByte._QK_KB, basicKeyToByte._QK_KB_MAX],
    [basicKeyToByte._QK_MACRO, basicKeyToByte._QK_MACRO_MAX],
  ].some((code) => byte >= code[0] && byte <= code[1]);
}

export function getCodeForByte(
  byte: number,
  basicKeyToByte: Record<string, number>,
  byteToKey: Record<number, string>,
) {
  const keycode = byteToKey[byte];
  if (keycode && !keycode.startsWith('_QK')) {
    return keycode;
  } else if (isLayerKey(byte, basicKeyToByte)) {
    return getCodeForLayerByte(byte, basicKeyToByte);
  } else if (
    advancedKeycodeToString(byte, basicKeyToByte, byteToKey) !== null
  ) {
    return advancedKeycodeToString(byte, basicKeyToByte, byteToKey);
  } else {
    return '0x' + Number(byte).toString(16);
  }
}

export function keycodeInMaster(
  keycode: string,
  basicKeyToByte: Record<string, number>,
) {
  return (
    keycode in basicKeyToByte ||
    isLayerCode(keycode) ||
    advancedStringToKeycode(keycode, basicKeyToByte) !== null
  );
}

function shorten(str: string) {
  return str
    .split(' ')
    .map((word) => word.slice(0, 1) + word.slice(1).replace(/[aeiou ]/gi, ''))
    .join('');
}

export function isCustomKeycodeByte(
  byte: number,
  basicKeyToByte: Record<string, number>,
) {
  return byte >= basicKeyToByte._QK_KB && byte <= basicKeyToByte._QK_KB_MAX;
}

export function getCustomKeycodeIndex(
  byte: number,
  basicKeyToByte: Record<string, number>,
) {
  return byte - basicKeyToByte._QK_KB;
}

export function isMacroKeycodeByte(
  byte: number,
  basicKeyToByte: Record<string, number>,
) {
  return (
    byte >= basicKeyToByte._QK_MACRO && byte <= basicKeyToByte._QK_MACRO_MAX
  );
}

export function getMacroKeycodeIndex(
  byte: number,
  basicKeyToByte: Record<string, number>,
) {
  return byte - basicKeyToByte._QK_MACRO;
}

export function getLabelForByte(
  byte: number,
  size = 100,
  basicKeyToByte: Record<string, number>,
  byteToKey: Record<number, string>,
) {
  const keycode = getCodeForByte(byte, basicKeyToByte, byteToKey);
  const basicKeycode = keycodesList.find(({code}) => code === keycode);
  if (!basicKeycode) {
    return keycode;
  }
  return getShortNameForKeycode(basicKeycode, size);
}

export function getShortNameForKeycode(keycode: IKeycode, size = 100) {
  const {code, name, shortName} = keycode;
  if (size <= 150 && shortName) {
    return shortName;
  }
  if (size === 100 && name.length > 5) {
    const shortenedName = shorten(name);
    if (!!code) {
      const shortCode = code.replace('KC_', '').replace('_', ' ');
      return shortenedName.length > 4 && shortCode.length < shortenedName.length
        ? shortCode
        : shortenedName;
    }
    return shortenedName;
  }
  return name;
}

export function getOtherMenu(
  basicKeyToByte: Record<string, number>,
): IKeycodeMenu {
  const keycodes = Object.keys(basicKeyToByte)
    .filter((key) => !key.startsWith('_QK'))
    .filter((key) => !keycodesList.map(({code}) => code).includes(key))
    .map((code) => ({
      name: code.replace('KC_', '').replace(/_/g, ' '),
      code: code,
    }));

  return {
    label: '其他',
    keycodes,
  };
}

function buildLayerMenu(): IKeycodeMenu {
  const hardCodedKeycodes: IKeycode[] = [
    {
      name: 'Fn1\n(Fn3)',
      code: 'FN_MO13',
      title: '按住临时切换到Layer\x201,\x20松开回到当前Layer,\x20和Fn2一起按则切换到Layer\x203',
      shortName: 'Fn1(3)',
    },
    {
      name: 'Fn2\n(Fn3)',
      code: 'FN_MO23',
      title: '按住临时切换到Layer\x202,\x20松开回到当前Layer,\x20和Fn1一起按则切换到Layer\x203',
      shortName: 'Fn2(3)',
    },
    {
      name: 'Space Fn1',
      code: 'LT(1,KC_SPC)',
      title: '按住临时切换到Layer1,松开回到当前Layer,短按=Space',
      shortName: 'Spc Fn1',
    },
    {
      name: 'Space Fn2',
      code: 'LT(2,KC_SPC)',
      title: '按住临时切换到Layer2,松开回到当前Layer,短按=Space',
      shortName: 'Spc Fn2',
    },
    {
      name: 'Space Fn3',
      code: 'LT(3,KC_SPC)',
      title: '按住临时切换到Layer3,松开回到当前Layer,短按=Space',
      shortName: 'Spc Fn3',
    },
  ];

  const menu: IKeycodeMenu = {
    label: '层管理键',
    width: 'label',
    keycodes: [
      {
        name: 'MO',
        code: 'MO(layer)',
        type: 'layer',
        layer: 0,
        title: '同Fn键\x20按下临时切换到layer\x20松开回到当前层',
      },
      {
        name: 'TG',
        code: 'TG(layer)',
        type: 'layer',
        layer: 0,
        title: '按下后切换到layer\x20,再次按下回到当前层',
      },
      {
        name: 'TT',
        code: 'TT(layer)',
        type: 'layer',
        layer: 0,
        title:
          "功能和MO(FN)一样,但是连按五下,将切换到layer",
      },
      {
        name: 'OSL',
        code: 'OSL(layer)',
        type: 'layer',
        layer: 0,
        title: '临时触发键:触发后下一个按下的键,键值为触发键在layer\x20的键值',
      },
      {
        name: 'TO',
        code: 'TO(layer)',
        type: 'layer',
        layer: 0,
        title: '切换到layer',
      },
      {
        name: 'DF',
        code: 'DF(layer)',
        type: 'layer',
        layer: 0,
        title: '设置默认层为layer',
      },
    ],
  };

  // Statically generate layer codes from 0-9 instead of making it an input
  return {
    ...menu,
    keycodes: [
      ...hardCodedKeycodes,
      ...menu.keycodes.flatMap((keycode) => {
        let res: IKeycode[] = [];
        for (let idx = 0; idx < 10; idx++) {
          const newTitle = (keycode.title || '').replace(
            'layer',
            `layer ${idx}`,
          );
          const newCode = keycode.code.replace('layer', `${idx}`);
          const newName = keycode.name + `(${idx})`;
          res = [
            ...res,
            {...keycode, name: newName, title: newTitle, code: newCode},
          ];
        }
        return res;
      }),
    ],
  };
}

export function getKeycodes(): IKeycodeMenu[] {
  return [
    {
      label: '基础键',
      keycodes: [
        {name: '', code: 'KC_NO', title: '空键位'},
        {name: '▽', code: 'KC_TRNS', title: '保持前一层的键值'},
        // TODO: remove "shortName" when multiline keycap labels are working
        {name: 'Esc', code: 'KC_ESC', keys: 'esc'},
        {name: 'A', code: 'KC_A', keys: 'a'},
        {name: 'B', code: 'KC_B', keys: 'b'},
        {name: 'C', code: 'KC_C', keys: 'c'},
        {name: 'D', code: 'KC_D', keys: 'd'},
        {name: 'E', code: 'KC_E', keys: 'e'},
        {name: 'F', code: 'KC_F', keys: 'f'},
        {name: 'G', code: 'KC_G', keys: 'g'},
        {name: 'H', code: 'KC_H', keys: 'h'},
        {name: 'I', code: 'KC_I', keys: 'i'},
        {name: 'J', code: 'KC_J', keys: 'j'},
        {name: 'K', code: 'KC_K', keys: 'k'},
        {name: 'L', code: 'KC_L', keys: 'l'},
        {name: 'M', code: 'KC_M', keys: 'm'},
        {name: 'N', code: 'KC_N', keys: 'n'},
        {name: 'O', code: 'KC_O', keys: 'o'},
        {name: 'P', code: 'KC_P', keys: 'p'},
        {name: 'Q', code: 'KC_Q', keys: 'q'},
        {name: 'R', code: 'KC_R', keys: 'r'},
        {name: 'S', code: 'KC_S', keys: 's'},
        {name: 'T', code: 'KC_T', keys: 't'},
        {name: 'U', code: 'KC_U', keys: 'u'},
        {name: 'V', code: 'KC_V', keys: 'v'},
        {name: 'W', code: 'KC_W', keys: 'w'},
        {name: 'X', code: 'KC_X', keys: 'x'},
        {name: 'Y', code: 'KC_Y', keys: 'y'},
        {name: 'Z', code: 'KC_Z', keys: 'z'},
        {name: '!\n1', code: 'KC_1', keys: '1'},
        {name: '@\n2', code: 'KC_2', keys: '2'},
        {name: '#\n3', code: 'KC_3', keys: '3'},
        {name: '$\n4', code: 'KC_4', keys: '4'},
        {name: '%\n5', code: 'KC_5', keys: '5'},
        {name: '^\n6', code: 'KC_6', keys: '6'},
        {name: '&\n7', code: 'KC_7', keys: '7'},
        {name: '*\n8', code: 'KC_8', keys: '8'},
        {name: '(\n9', code: 'KC_9', keys: '9'},
        {name: ')\n0', code: 'KC_0', keys: '0'},
        {name: '_\n-', code: 'KC_MINS', keys: '-'},
        {name: '+\n=', code: 'KC_EQL', keys: '='},
        {name: '~\n`', code: 'KC_GRV', keys: '`'},
        {name: '{\n[', code: 'KC_LBRC', keys: '['},
        {name: '}\n]', code: 'KC_RBRC', keys: ']'},
        {name: '|\n\\', code: 'KC_BSLS', keys: '\\', width: 1500},
        {name: ':\n;', code: 'KC_SCLN', keys: ';'},
        {name: '"\n\'', code: 'KC_QUOT', keys: "'"},
        {name: '<\n,', code: 'KC_COMM', keys: ','},
        {name: '>\n.', code: 'KC_DOT', keys: '.'},
        {name: '?\n/', code: 'KC_SLSH', keys: '/'},
        {name: '=', code: 'KC_PEQL'},
        {name: ',', code: 'KC_PCMM'},
        {name: 'F1', code: 'KC_F1'},
        {name: 'F2', code: 'KC_F2'},
        {name: 'F3', code: 'KC_F3'},
        {name: 'F4', code: 'KC_F4'},
        {name: 'F5', code: 'KC_F5'},
        {name: 'F6', code: 'KC_F6'},
        {name: 'F7', code: 'KC_F7'},
        {name: 'F8', code: 'KC_F8'},
        {name: 'F9', code: 'KC_F9'},
        {name: 'F10', code: 'KC_F10'},
        {name: 'F11', code: 'KC_F11'},
        {name: 'F12', code: 'KC_F12'},
        {name: 'Print Screen', code: 'KC_PSCR', shortName: 'Print',title:'系统给你的截图键'},
        {name: 'Scroll Lock', code: 'KC_SLCK', shortName: 'Scroll',title:'滚动锁定'},
        {name: 'Pause', code: 'KC_PAUS'},
        {name: 'Tab', code: 'KC_TAB', keys: 'tab', width: 1500},
        {
          name: 'Backspace',
          code: 'KC_BSPC',
          keys: 'backspace',
          width: 2000,
          shortName: 'Bksp',
        },
        {name: 'Insert', code: 'KC_INS', keys: 'insert', shortName: 'Ins'},
        {name: 'Del', code: 'KC_DEL', keys: 'delete'},
        {name: 'Home', code: 'KC_HOME', keys: 'home'},
        {name: 'End', code: 'KC_END', keys: 'end'},
        {name: 'Page Up', code: 'KC_PGUP', keys: 'pageup', shortName: 'PgUp'},
        {
          name: 'Page Down',
          code: 'KC_PGDN',
          keys: 'pagedown',
          shortName: 'PgDn',
        },
        {name: 'Num Lock', code: 'KC_NLCK', keys: 'num', shortName: 'N.Lck',title: '数字锁定'},
        {name: 'Caps Lock', code: 'KC_CAPS', keys: 'caps_lock',width: 1750, title: '大写锁定'},
        {name: 'Enter', code: 'KC_ENT', keys: 'enter', width: 2250},
        {name: '1', code: 'KC_P1', keys: 'num_1', title: 'Numpad 1'},
        {name: '2', code: 'KC_P2', keys: 'num_2', title: 'Numpad 2'},
        {name: '3', code: 'KC_P3', keys: 'num_3', title: 'Numpad 3'},
        {name: '4', code: 'KC_P4', keys: 'num_4', title: 'Numpad 4'},
        {name: '5', code: 'KC_P5', keys: 'num_5', title: 'Numpad 5'},
        {name: '6', code: 'KC_P6', keys: 'num_6', title: 'Numpad 6'},
        {name: '7', code: 'KC_P7', keys: 'num_7', title: 'Numpad 7'},
        {name: '8', code: 'KC_P8', keys: 'num_8', title: 'Numpad 8'},
        {name: '9', code: 'KC_P9', keys: 'num_9', title: 'Numpad 9'},
        {
          name: '0',
          code: 'KC_P0',
          width: 2000,
          keys: 'num_0',
          title: 'Numpad 0',
        },
        {name: '÷', code: 'KC_PSLS', keys: 'num_divide', title: 'Numpad ÷'},
        {name: '×', code: 'KC_PAST', keys: 'num_multiply', title: 'Numpad ×'},
        {name: '-', code: 'KC_PMNS', keys: 'num_subtract', title: 'Numpad -'},
        {name: '+', code: 'KC_PPLS', keys: 'num_add', title: 'Numpad +'},
        {name: '.', code: 'KC_PDOT', keys: 'num_decimal', title: 'Numpad .'},
        {
          name: 'Num\nEnter',
          code: 'KC_PENT',
          shortName: 'N.Ent',
          title: 'Numpad Enter',
        },
        {
          name: 'Left Shift',
          code: 'KC_LSFT',
          keys: 'shift',
          width: 2250,
          shortName: 'LShft',
        },
        {name: 'RShift', code: 'KC_RSFT', width: 2750, shortName: 'RShft'},
        {name: 'Left Ctrl', code: 'KC_LCTL', keys: 'ctrl', width: 1250},
        {name: 'RCtrl', code: 'KC_RCTL', width: 1250, shortName: 'RCtl'},
        {
          name: 'LWin',
          code: 'KC_LGUI',
          keys: 'cmd',
          width: 1250,
          shortName: 'LWin',
        },
        {name: 'RWin', code: 'KC_RGUI', width: 1250, shortName: 'RWin'},
        {
          name: 'LAlt',
          code: 'KC_LALT',
          keys: 'alt',
          width: 1250,
          shortName: 'LAlt',
        },
        {name: 'RAlt', code: 'KC_RALT', width: 1250, shortName: 'RAlt'},
        {name: 'Space', code: 'KC_SPC', keys: 'space', width: 6250},
        {name: 'Menu', code: 'KC_APP', width: 1250, shortName: 'RApp'},
        {name: '←', code: 'KC_LEFT', keys: 'left', shortName: '←'},
        {name: '↓', code: 'KC_DOWN', keys: 'down', shortName: '↓'},
        {name: '↑', code: 'KC_UP', keys: 'up', shortName: '↑'},
        {name: '→', code: 'KC_RGHT', keys: 'right', shortName: '→'},
      ],
    },
    {
      label: '灯光键',
      width: 'label',
      keycodes: [
        {name: '亮度 -', code: 'BR_DEC', title: '亮度 -'},
        {name: '亮度 +', code: 'BR_INC', title: '亮度 +'},
        {name: '灯效 -', code: 'EF_DEC', title: '灯效 -'},
        {name: '灯效 +', code: 'EF_INC', title: '灯效 +'},
        {name: '灯效\n速度 -', code: 'ES_DEC', title: '灯效速度 -'},
        {name: '灯效\n速度 +', code: 'ES_INC', title: '灯效速度 +'},
        {name: 'H1 -', code: 'H1_DEC', title: 'Color1 Hue -'},
        {name: 'H1 +', code: 'H1_INC', title: 'Color1 Hue +'},
        {name: 'H2 -', code: 'H2_DEC', title: 'Color2 Hue -'},
        {name: 'H2 +', code: 'H2_INC', title: 'Color2 Hue +'},
        {name: 'S1 -', code: 'S1_DEC', title: 'Color1 Sat -'},
        {name: 'S1 +', code: 'S1_INC', title: 'Color1 Sat +'},
        {name: 'S2 -', code: 'S2_DEC', title: 'Color2 Sat -'},
        {name: 'S2 +', code: 'S2_INC', title: 'Color2 Sat +'},
      ],
    },
    {
      label: '媒体键',
      width: 'label',
      keycodes: [
        {name: '音量-', code: 'KC_VOLD', title: '音量降低'},
        {name: '音量 +', code: 'KC_VOLU', title: '音量提高'},
        {name: '静音', code: 'KC_MUTE', title: '电脑静音'},
        {name: '播放/\n暂停', code: 'KC_MPLY', title: '播放/暂停'},
        {name: '多媒体停止', code: 'KC_MSTP', title: '多媒体停止'},
        {name: '上一首', code: 'KC_MPRV', title: '上一首'},
        {name: '下一首', code: 'KC_MNXT', title: '下一首'},
        {name: '倒退', code: 'KC_MRWD', title: '倒退'},
        {name: '快进', code: 'KC_MFFD', title: '快进'},
        {name: '启动播放器', code: 'KC_MSEL', title: '启动\n播放器'},
        {name: '多媒体弹出', code: 'KC_EJCT', title: '多媒体弹出'},
      ],
    },
    {
      label: '宏',
      width: 'label',
      keycodes: [
        {name: 'M0', code: 'MACRO(0)', title: '执行序号为0的宏'},
        {name: 'M1', code: 'MACRO(1)', title: '执行序号为1的宏'},
        {name: 'M2', code: 'MACRO(2)', title: '执行序号为2的宏'},
        {name: 'M3', code: 'MACRO(3)', title: '执行序号为3的宏'},
        {name: 'M4', code: 'MACRO(4)', title: '执行序号为4的宏'},
        {name: 'M5', code: 'MACRO(5)', title: '执行序号为5的宏'},
        {name: 'M6', code: 'MACRO(6)', title: '执行序号为6的宏'},
        {name: 'M7', code: 'MACRO(7)', title: '执行序号为7的宏'},
        {name: 'M8', code: 'MACRO(8)', title: '执行序号为8的宏'},
        {name: 'M9', code: 'MACRO(9)', title: '执行序号为9的宏'},
        {name: 'M10', code: 'MACRO(10)', title: '执行序号为10的宏'},
        {name: 'M11', code: 'MACRO(11)', title: '执行序号为11的宏'},
        {name: 'M12', code: 'MACRO(12)', title: '执行序号为12的宏'},
        {name: 'M13', code: 'MACRO(13)', title: '执行序号为13的宏'},
        {name: 'M14', code: 'MACRO(14)', title: '执行序号为14的宏'},
        {name: 'M15', code: 'MACRO(15)', title: '执行序号为15的宏'},
      ],
    },
    buildLayerMenu(),
    {
      label: 'Mod+_',
      width: 'label',
      detailed: '(A = Alt, C = Control, G = Windows/Command, S = Shift)',
      keycodes: [
        {name: 'LSft', code: 'LSFT(kc)', type: 'container'},
        {name: 'LCtl', code: 'LCTL(kc)', type: 'container'},
        {name: 'LAlt', code: 'LALT(kc)', type: 'container'},
        {name: 'LGui', code: 'LGUI(kc)', type: 'container'},
        {name: 'RSft', code: 'RSFT(kc)', type: 'container'},
        {name: 'RCtl', code: 'RCTL(kc)', type: 'container'},
        {name: 'RAlt', code: 'RALT(kc)', type: 'container'},
        {name: 'RGui', code: 'RGUI(kc)', type: 'container'},
        {
          name: 'Hyper',
          code: 'HYPR(kc)',
          type: 'container',
          title: 'LCTL + LSFT + LALT + LGUI',
        },
        {
          name: 'Meh',
          code: 'MEH(kc)',
          type: 'container',
          title: 'LCTL + LSFT + LALT',
        },
        {
          name: 'LCAG',
          code: 'LCAG(kc)',
          type: 'container',
          title: 'LCTL + LALT + LGUI',
        },
        {
          name: 'ALTG',
          code: 'ALTG(kc)',
          type: 'container',
          title: 'RCTL + RALT',
        },
        {
          name: 'SGUI',
          code: 'SCMD(kc)',
          type: 'container',
          title: 'LGUI + LSFT',
        },
        {name: 'LCA', code: 'LCA(kc)', type: 'container', title: 'LCTL + LALT'},
        {
          name: 'LSft_T',
          code: 'LSFT_T(kc)',
          type: 'container',
          title: 'Shift when held, kc when tapped',
        },
        {
          name: 'LCtl_T',
          code: 'LCTL_T(kc)',
          type: 'container',
          title: 'Control when held, kc when tapped',
        },
        {
          name: 'LAlt_T',
          code: 'LALT_T(kc)',
          type: 'container',
          title: 'Alt when held, kc when tapped',
        },
        {
          name: 'LGui_T',
          code: 'LGUI_T(kc)',
          type: 'container',
          title: 'Gui when held, kc when tapped',
        },
        {
          name: 'RSft_T',
          code: 'RSFT_T(kc)',
          type: 'container',
          title: 'Shift when held, kc when tapped',
        },
        {
          name: 'RCtl_T',
          code: 'RCTL_T(kc)',
          type: 'container',
          title: 'Control when held, kc when tapped',
        },
        {
          name: 'RAlt_T',
          code: 'RALT_T(kc)',
          type: 'container',
          title: 'Alt when held, kc when tapped',
        },
        {
          name: 'RGui_T',
          code: 'RGUI_T(kc)',
          type: 'container',
          title: 'Gui when held, kc when tapped',
        },
        {
          name: 'CS_T',
          code: 'C_S_T(kc)',
          type: 'container',
          title: 'Control + Shift when held, kc when tapped',
        },
        {
          name: 'All_T',
          code: 'ALL_T(kc)',
          type: 'container',
          title: 'LCTL + LSFT + LALT + LGUI when held, kc when tapped',
        },
        {
          name: 'Meh_T',
          code: 'MEH_T(kc)',
          type: 'container',
          title: 'LCTL + LSFT + LALT when held, kc when tapped',
        },
        {
          name: 'LCAG_T',
          code: 'LCAG_T(kc)',
          type: 'container',
          title: 'LCTL + LALT + LGUI when held, kc when tapped',
        },
        {
          name: 'RCAG_T',
          code: 'RCAG_T(kc)',
          type: 'container',
          title: 'RCTL + RALT + RGUI when held, kc when tapped',
        },
        {
          name: 'SGUI_T',
          code: 'SCMD_T(kc)',
          type: 'container',
          title: 'LGUI + LSFT when held, kc when tapped',
        },
        {
          name: 'LCA_T',
          code: 'LCA_T(kc)',
          type: 'container',
          title: 'LCTL + LALT when held, kc when tapped',
        },
      ],
    },
    {
      label: '特殊键',
      width: 'label',
      keycodes: [
        {name: '~', code: 'S(KC_GRV)', keys: '`', title: 'Shift + `'},
        {name: '!', code: 'S(KC_1)', keys: '!', title: 'Shift + 1'},
        {name: '@', code: 'S(KC_2)', keys: '@', title: 'Shift + 2'},
        {name: '#', code: 'S(KC_3)', keys: '#', title: 'Shift + 3'},
        {name: '$', code: 'S(KC_4)', keys: '$', title: 'Shift + 4'},
        {name: '%', code: 'S(KC_5)', keys: '%', title: 'Shift + 5'},
        {name: '^', code: 'S(KC_6)', keys: '^', title: 'Shift + 6'},
        {name: '&', code: 'S(KC_7)', keys: '&', title: 'Shift + 7'},
        {name: '*', code: 'S(KC_8)', keys: '*', title: 'Shift + 8'},
        {name: '(', code: 'S(KC_9)', keys: '(', title: 'Shift + 9'},
        {name: ')', code: 'S(KC_0)', keys: ')', title: 'Shift + 0'},
        {name: '_', code: 'S(KC_MINS)', keys: '_', title: 'Shift + -'},
        {name: '+', code: 'S(KC_EQL)', keys: '+', title: 'Shift + ='},
        {name: '{', code: 'S(KC_LBRC)', keys: '{', title: 'Shift + ['},
        {name: '}', code: 'S(KC_RBRC)', keys: '}', title: 'Shift + ]'},
        {name: '|', code: 'S(KC_BSLS)', keys: '|', title: 'Shift + \\'},
        {name: ':', code: 'S(KC_SCLN)', keys: ':', title: 'Shift + /'},
        {name: '"', code: 'S(KC_QUOT)', keys: '"', title: "Shift + '"},
        {name: '<', code: 'S(KC_COMM)', keys: '<', title: 'Shift + ,'},
        {name: '>', code: 'S(KC_DOT)', keys: '>', title: 'Shift + .'},
        {name: '?', code: 'S(KC_SLSH)', keys: '?', title: 'Shift + /'},
        {name: 'NUHS', code: 'KC_NUHS', title: 'Non-US # and ~'},
        {name: 'NUBS', code: 'KC_NUBS', title: 'Non-US \\ and |'},
        {name: 'Ro', code: 'KC_RO', title: 'JIS \\ and |'},
        {name: '¥', code: 'KC_JYEN', title: 'JPN Yen'},
        {name: '無変換', code: 'KC_MHEN', title: 'JIS Muhenkan'},
        {name: '漢字', code: 'KC_HANJ', title: 'Hanja'},
        {name: '한영', code: 'KC_HAEN', title: 'HanYeong'},
        {name: '変換', code: 'KC_HENK', title: 'JIS Henkan'},
        {name: 'かな', code: 'KC_KANA', title: 'JIS Katakana/Hiragana'},
        {
          name: 'Esc `',
          code: 'KC_GESC',
          title: 'Esc normally, but ` when Shift or Win is pressed',
        },
        {
          name: 'LS (',
          code: 'KC_LSPO',
          title: 'Left Shift when held, ( when tapped',
        },
        {
          name: 'RS )',
          code: 'KC_RSPC',
          title: 'Right Shift when held, ) when tapped',
        },
        {
          name: 'LC (',
          code: 'KC_LCPO',
          title: 'Left Control when held, ( when tapped',
        },
        {
          name: 'RC )',
          code: 'KC_RCPC',
          title: 'Right Control when held, ) when tapped',
        },
        {
          name: 'LA (',
          code: 'KC_LAPO',
          title: 'Left Alt when held, ( when tapped',
        },
        {
          name: 'RA )',
          code: 'KC_RAPC',
          title: 'Right Alt when held, ) when tapped',
        },
        {
          name: 'SftEnt',
          code: 'KC_SFTENT',
          title: 'Right Shift when held, Enter when tapped',
        },
        {name: '重置/\n进DFU', code: 'RESET', title: 'Reset the keyboard'},
        {name: '开启\n调试', code: 'DEBUG', title: 'Toggle debug mode'},
        {
          name: '开启\n全键无冲',
          code: 'MAGIC_TOGGLE_NKRO',
          shortName: 'NKRO',
          title: 'Toggle NKRO',
        },
        // I don't even think the locking stuff is enabled...
        {name: 'Locking Num Lock', code: 'KC_LNUM'},
        {name: 'Locking Caps Lock', code: 'KC_LCAP'},
        {name: 'Locking Scroll Lock', code: 'KC_LSCR'},
        {name: 'Power', code: 'KC_PWR'},
        {name: 'Power OSX', code: 'KC_POWER'},
        {name: 'Sleep', code: 'KC_SLEP'},
        {name: 'Wake', code: 'KC_WAKE'},
        {name: '计算器', code: 'KC_CALC'},
        {name: '邮件', code: 'KC_MAIL'},
        {name: '帮助', code: 'KC_HELP'},
        {name: 'Stop', code: 'KC_STOP'},
        {name: 'Alt Erase', code: 'KC_ERAS'},
        {name: 'Again', code: 'KC_AGAIN'},
        {name: 'Menu', code: 'KC_MENU'},
        {name: 'Undo', code: 'KC_UNDO'},
        {name: 'Select', code: 'KC_SELECT'},
        {name: 'Exec', code: 'KC_EXECUTE'},
        {name: '剪切', code: 'KC_CUT'},
        {name: '复制', code: 'KC_COPY'},
        {name: '粘贴', code: 'KC_PASTE'},
        {name: 'Find', code: 'KC_FIND'},
        {name: '打开计算机', code: 'KC_MYCM'},
        {name: '浏览器首页', code: 'KC_WWW_HOME'},
        {name: '浏览器返回', code: 'KC_WWW_BACK'},
        {name: '浏览器前进', code: 'KC_WWW_FORWARD'},
        {name: '浏览器停止载入', code: 'KC_WWW_STOP'},
        {name: '浏览器刷新', code: 'KC_WWW_REFRESH'},
        {name: '浏览器收藏夹', code: 'KC_WWW_FAVORITES'},
        {name: '浏览器搜索', code: 'KC_WWW_SEARCH'},
        {
          name: '屏幕亮度 +',
          code: 'KC_BRIU',
          shortName: 'Scr +',
          title: '屏幕亮度提高',
        },
        {
          name: '屏幕亮度 -',
          code: 'KC_BRID',
          shortName: 'Scr -',
          title: '屏幕亮度降低',
        },
        {name: 'F13', code: 'KC_F13'},
        {name: 'F14', code: 'KC_F14'},
        {name: 'F15', code: 'KC_F15'},
        {name: 'F16', code: 'KC_F16'},
        {name: 'F17', code: 'KC_F17'},
        {name: 'F18', code: 'KC_F18'},
        {name: 'F19', code: 'KC_F19'},
        {name: 'F20', code: 'KC_F20'},
        {name: 'F21', code: 'KC_F21'},
        {name: 'F22', code: 'KC_F22'},
        {name: 'F23', code: 'KC_F23'},
        {name: 'F24', code: 'KC_F24'},

        // TODO: move these to a new group
        {name: '鼠标 ↑', code: 'KC_MS_UP'},
        {name: '鼠标 ↓', code: 'KC_MS_DOWN'},
        {name: '鼠标 ←', code: 'KC_MS_LEFT'},
        {name: '鼠标 →', code: 'KC_MS_RIGHT'},
        {name: '鼠标\n左键', code: 'KC_MS_BTN1'},
        {name: '鼠标\n右键', code: 'KC_MS_BTN2'},
        {name: '鼠标\n中键', code: 'KC_MS_BTN3'},
        {name: '鼠标\n后退键', code: 'KC_MS_BTN4'},
        {name: '鼠标\n前进键', code: 'KC_MS_BTN5'},
        {name: 'Mouse Btn6', code: 'KC_MS_BTN6'},
        {name: 'Mouse Btn7', code: 'KC_MS_BTN7'},
        {name: 'Mouse Btn8', code: 'KC_MS_BTN8'},
        {name: '鼠标滚轮↑', code: 'KC_MS_WH_UP'},
        {name: '鼠标滚轮↑ ↓', code: 'KC_MS_WH_DOWN'},
        {name: '鼠标滚轮↑ ←', code: 'KC_MS_WH_LEFT'},
        {name: '鼠标滚轮↑ →', code: 'KC_MS_WH_RIGHT'},
        {name: '按住时鼠标慢速移动', code: 'KC_MS_ACCEL0'},
        {name: '按住时鼠标中速移动', code: 'KC_MS_ACCEL1'},
        {name: 'Mouse Acc2', code: 'KC_MS_ACCEL2'},

        // TODO: move these to a new group
        {name: 'Audio On', code: 'AU_ON'},
        {name: 'Audio Off', code: 'AU_OFF'},
        {name: 'Audio Toggle', code: 'AU_TOG'},
        {name: 'Clicky Toggle', code: 'CLICKY_TOGGLE'},
        {name: 'Clicky Enable', code: 'CLICKY_ENABLE'},
        {name: 'Clicky Disable', code: 'CLICKY_DISABLE'},
        {name: 'Clicky Up', code: 'CLICKY_UP'},
        {name: 'Clicky Down', code: 'CLICKY_DOWN'},
        {name: 'Clicky Reset', code: 'CLICKY_RESET'},
        {name: 'Music On', code: 'MU_ON'},
        {name: 'Music Off', code: 'MU_OFF'},
        {name: 'Music Toggle', code: 'MU_TOG'},
        {name: 'Music Mode', code: 'MU_MOD'},
      ],
    },
    /* These are for controlling the original backlighting and bottom RGB. */
    {
      label: 'QMK灯控键',
      width: 'label',
      keycodes: [
        {name: 'LED\n灯开关', code: 'BL_TOGG', title: 'LED轴灯开关'},
        {name: 'LED\n开', code: 'BL_ON', title: 'LED灯打关'},
        {name: 'LED\n关', code: 'BL_OFF', shortName: 'BL Off', title: 'LED灯关闭'},
        {name: 'LED灯亮度-', code: 'BL_DEC', title: 'LED轴灯亮度降低'},
        {name: 'LED灯亮度+', code: 'BL_INC', title: 'LED轴灯亮度提高'},
        {name: 'LED灯亮度\n循环', code: 'BL_STEP', title: 'LED轴灯亮度循环'},
        {name: 'LED灯呼吸\n灯效', code: 'BL_BRTG', title: 'LED灯呼吸灯效开关'},
        {name: 'RGB\n灯开关', code: 'RGB_TOG', title: 'RGB灯开关'},
        {name: 'RGB\n模式-', code: 'RGB_RMOD', title: 'RGB模式向后切换'},
        {name: 'RGB\n模式+', code: 'RGB_MOD', title: 'RGB模式向前切换'},
        {name: 'RGB\n色相-', code: 'RGB_HUD', title: 'RGB灯色相减'},
        {name: 'RGB\n色相+', code: 'RGB_HUI', title: 'RGB灯色相加'},
        {name: 'RGB\n饱和度-', code: 'RGB_SAD', title: 'RGB饱和度减'},
        {name: 'RGB\n饱和度+', code: 'RGB_SAI', title: 'RGB饱和度加'},
        {name: 'RGB灯\n亮度-', code: 'RGB_VAD', title: 'RGB灯亮度减'},
        {name: 'RGB灯\n亮度+', code: 'RGB_VAI', title: 'RGB灯亮度加'},
        {name: 'RGB\n灯效\n速度-', code: 'RGB_SPD', title: 'RGB灯效速度降低'},
        {name: 'RGB\n灯效\n速度+', code: 'RGB_SPI', title: 'RGB灯效速度提高'},
        {name: 'RGB\n静态\n灯效', code: 'RGB_M_P', title: 'RGB静态灯效'},
        {name: 'RGB\n呼吸\n灯效', code: 'RGB_M_B', title: 'RGB\n呼吸灯效'},
        {name: 'RGB 彩虹灯效单色渐变', code: 'RGB_M_R', title: 'RGB 彩虹灯效单色渐变'},
        {name: 'RGB 彩虹灯效彩色渐变', code: 'RGB_M_SW', title: 'RGB 彩虹灯效彩色渐变'},
        {name: 'RGB 贪吃蛇灯效', code: 'RGB_M_SN', title: 'RGB 贪吃蛇灯效'},
        {name: 'RGB 霹雳游侠灯效', code: 'RGB_M_K', title: 'RGB 霹雳游侠灯效'},
        {name: 'RGB 圣诞灯效', code: 'RGB_M_X', title: 'RGB 圣诞灯效'},
        {name: 'RGB\n静态梯度灯效', code: 'RGB_M_G', title: 'RGB 静态梯度灯效'},
      ],
    },
    {
      label: '万能组合键',
      width: 'label',
      keycodes: [
        {name: '左Ctrl+Alt', code: 'LCA_T', title: '左Ctrl+左Alt'},
        {name: '左Shift+Alt', code: 'LAS_T', title: '左Shift+Alt'},
        {name: '左Ctrl+Shift', code: 'LCS_T', title: '左Ctrl+左Shift'},
        {name: '左Shift+Shift+Alt', code: 'LCSA_T', title: '左Shift+Shift+Alt'},
        {name: '左Shift+Alt+Win', code: 'LCAW_T', title: '左Shift+Alt+Win'},
        {name: '左Shift+Win', code: 'LSW_T', title: '左Shift+Win'},
        {name: '左Shift+Shift+Win', code: 'LCSW_T', title: '左Shift+Shift+Win'},
        {name: '左Shift+Alt+Win', code: 'LSAW_T', title: '左Shift+Alt+Win'},
        {name: '左Ctrl+Shift+Alt+Win', code: 'LCSAW_T', title: '左Ctrl+Shift+Alt+Win'},
      ],
    },
    {
      label: 'PS快捷键',
      width: 'label',
      keycodes: [
        {name: '打开', code: 'C_KC_O', title: 'Ctrl+O'},
        {name: '新建', code: 'C_KC_N', title: 'Ctrl+N'},
        {name: '复制图层', code: 'C_KC_J', title: 'Ctrl+J'},
        {name: '填充背景色', code: 'C_KC_del', title: 'Ctrl+Delte'},
        {name: '填充前景色', code: 'A_KC_del', title: 'Alt+Delete'},
        {name: '存储为', code: 'CS_KC_S', title: 'Ctrl+Shift+S'},
        {name: 'RAW滤镜', code: 'CS_KC_A', title: 'Ctrl+Shift+A'},
        {name: '羽化', code: 'S_KC_F6', title: 'Shift+F6'},
        {name: '色阶', code: 'C_KC_L', title: 'Ctrl+L'},
        {name: '曲线', code: 'C_KC_M', title: 'Ctrl+M'},
        {name: '反相', code: 'C_KC_I', title: 'Ctrl+I'},
        {name: '显示标尺', code: 'C_KC_R', title: 'Ctrl+R'},
        {name: '工作区缩小', code: 'C_KC_1', title: 'Ctrl+-'},
        {name: '工作区放大', code: 'C_KC_2', title: 'Ctrl++'},
        {name: '填充', code: 'S_KC_F5', title: 'Shift+F5'},
        {name: '新建图层', code: 'CS_KC_N', title: 'Ctrl+Shift+N'},
        {name: '去色', code: 'CS_KC_U', title: 'Ctrl+Shift+U'},
        {name: '还原两步操作', code: 'AC_KC_Z', title: 'Alt+Ctrl+Z'},
        {name: '反选', code: 'CS_KC_I', title: 'Ctrl+Shift+I'},
        {name: '重做上一步', code: 'CS_KC_Z', title: 'Ctrl+Shift+Z'},
        {name: '快捷键设置', code: 'ACS_KC_K', title: 'Alt+Ctrl+Shift+K'},
        {name: '重复上一步', code: 'ACS_KC_T', title: 'Alt+Ctrl+Shift+T'},
        {name: '新建盖印图层', code: 'ACS_KC_E', title: 'Alt+Ctrl+Shift+E'},
        {name: '合并可见图层', code: 'CS_KC_E', title: 'Ctrl+Shift+E'},
        {name: '向下合并图层', code: 'C_KC_E', title: 'Ctrl+E'},
        {name: '新建盖印图层', code: 'AS_KC_S', title: 'Shift+Alt+S'},
        {name: '下移一层', code: 'C_KC_LB', title: 'Ctrl+['},
        {name: '上移一层', code: 'C_KC_RB', title: 'Ctrl+]'},
        {name: '移到最底层', code: 'CS_KC_LB', title: 'Ctrl+Shift+]'},
        {name: '移到最顶层', code: 'CS_KC_RB', title: 'Ctrl+Shift+]'},
        {name: '更多请使用万能键', code: '_KC_', title: '更多请使用万能键，欢迎提供更多常用快捷键.......汉化作者：随机复读的复读姬'},
      ],
    },
    {
      label: 'AI快捷键',
      width: 'label',
      keycodes: [
        {name: '打开', code: 'C_KC_O', title: 'Ctrl+O'},
        {name: '新建', code: 'C_KC_N', title: 'Ctrl+N'},
        {name: '贴在前面', code: 'C_F', title: 'Ctrl+F'},
        {name: '贴在后面', code: 'C_B', title: 'Ctrl+B'},
        {name: '原位粘贴', code: 'SC_B', title: 'Shift+Ctrl+B'},
        {name: '原位粘贴', code: 'ASC_B', title: 'Alt+Shift+Ctrl+B'},
        {name: '颜色设置', code: 'SC_K', title: 'Shift+Ctrl+K'},
        {name: '键盘快捷键', code: 'ASC_K', title: 'Alt+Shift+Ctrl+K'},
        {name: '存储副本', code: 'AC_S', title: 'Alt+Ctrl+S'},
        {name: '选择上方对象', code: 'AC_RB', title: 'Alt+Ctrl+]'},
        {name: '选择下方对象', code: 'AC_LB', title: 'Alt+Ctrl+['},
        {name: '编组选择画稿', code: 'C_G', title: 'Ctrl+G'},
        {name: '取消选中的画稿组', code: 'SC_G', title: 'Shift+Ctrl+G'},
        {name: '锁定选择对象', code: 'C_2', title: 'Ctrl+2'},
        {name: '解锁所选对象', code: 'AC_2', title: 'Alt+Ctrl+2'},
        {name: '锁定所有取消选择的对象', code: 'ASC_2', title: 'Alt+Shift+Ctrl+2 锁定所有取消选择的对象'},
        {name: '隐藏所选对象', code: 'C_3', title: 'Ctrl+3'},
        {name: '显示所选对象', code: 'AC_3', title: 'Alt+Ctrl+3'},
        {name: '创建复合路径', code: 'C_8', title: 'Ctrl+8'},
        {name: '创建复合路径', code: 'AC_8', title: 'Alt+Ctrl+8'},
        {name: '添加图层', code: 'C_L', title: 'Ctrl+L'},
        {name: '更多请使用万能键', code: '_KC_', title: '更多请使用万能键，欢迎提供更多常用快捷键.......汉化作者：随机复读的复读姬'},
      ],
    },
    {
      label: 'PR/达芬奇',
      width: 'label',
      keycodes: [
        {name: '打开', code: 'C_KC_O', title: 'Ctrl+O'},
        {name: '新建', code: 'C_KC_N', title: 'Ctrl+N'},
        {name: '更多请使用万能键', code: '_KC_', title: '更多请使用万能键，欢迎提供更多常用快捷键.......汉化作者：随机复读的复读姬'},
      ],
    },
    /*
     These custom keycodes always exist and should be filtered out if necessary
     Name and Title should be replaced with the correct ones from the keyboard json
    */
    {
      label: '自定义键位',
      width: 'label',
      keycodes: [
        {name: 'CUSTOM(0)', code: 'CUSTOM(0)', title: 'Custom Keycode 0'},
        {name: 'CUSTOM(1)', code: 'CUSTOM(1)', title: 'Custom Keycode 1'},
        {name: 'CUSTOM(2)', code: 'CUSTOM(2)', title: 'Custom Keycode 2'},
        {name: 'CUSTOM(3)', code: 'CUSTOM(3)', title: 'Custom Keycode 3'},
        {name: 'CUSTOM(4)', code: 'CUSTOM(4)', title: 'Custom Keycode 4'},
        {name: 'CUSTOM(5)', code: 'CUSTOM(5)', title: 'Custom Keycode 5'},
        {name: 'CUSTOM(6)', code: 'CUSTOM(6)', title: 'Custom Keycode 6'},
        {name: 'CUSTOM(7)', code: 'CUSTOM(7)', title: 'Custom Keycode 7'},
        {name: 'CUSTOM(8)', code: 'CUSTOM(8)', title: 'Custom Keycode 8'},
        {name: 'CUSTOM(9)', code: 'CUSTOM(9)', title: 'Custom Keycode 9'},
        {name: 'CUSTOM(10)', code: 'CUSTOM(10)', title: 'Custom Keycode 10'},
        {name: 'CUSTOM(11)', code: 'CUSTOM(11)', title: 'Custom Keycode 11'},
        {name: 'CUSTOM(12)', code: 'CUSTOM(12)', title: 'Custom Keycode 12'},
        {name: 'CUSTOM(13)', code: 'CUSTOM(13)', title: 'Custom Keycode 13'},
        {name: 'CUSTOM(14)', code: 'CUSTOM(14)', title: 'Custom Keycode 14'},
        {name: 'CUSTOM(15)', code: 'CUSTOM(15)', title: 'Custom Keycode 15'},
      ],
    },
  ];
}

export const categoriesForKeycodeModule = (
  keycodeModule: BuiltInKeycodeModule | 'default',
) =>
  ({
    default: ['Basic', 'Media', 'Macro', 'Layers', 'Special'],
    [BuiltInKeycodeModule.WTLighting]: ['Lighting'],
    [BuiltInKeycodeModule.QMKLighting]: ['QMK Lighting'],
  }[keycodeModule]);

export const getKeycodesForKeyboard = (
  definition: VIADefinitionV3 | VIADefinitionV2,
) => {
  // v2
  let includeList: string[] = [];
  if ('lighting' in definition) {
    const {keycodes} = getLightingDefinition(definition.lighting);
    includeList = categoriesForKeycodeModule('default').concat(
      keycodes === KeycodeType.None
        ? []
        : keycodes === KeycodeType.QMK
        ? categoriesForKeycodeModule(BuiltInKeycodeModule.QMKLighting)
        : categoriesForKeycodeModule(BuiltInKeycodeModule.WTLighting),
    );
  } else {
    const {keycodes} = definition;
    includeList = keycodes.flatMap(categoriesForKeycodeModule);
  }
  return getKeycodes()
    .flatMap((keycodeMenu) =>
      includeList.includes(keycodeMenu.label) ? keycodeMenu.keycodes : [],
    )
    .sort((a, b) => {
      if (a.code <= b.code) {
        return -1;
      } else {
        return 1;
      }
    });
};
