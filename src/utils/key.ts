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
  return /[๐ ๐ ๐ ๐ โโโโ]$/.test(label);
}

export function isNumpadSymbol(label: string) {
  const centeredSymbol = '-+.รทร'.split('');
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
    label: 'ๅถไป',
    keycodes,
  };
}

function buildLayerMenu(): IKeycodeMenu {
  const hardCodedKeycodes: IKeycode[] = [
    {
      name: 'Fn1\n(Fn3)',
      code: 'FN_MO13',
      title: 'ๆไฝไธดๆถๅๆขๅฐLayer\x201,\x20ๆพๅผๅๅฐๅฝๅLayer,\x20ๅFn2ไธ่ตทๆๅๅๆขๅฐLayer\x203',
      shortName: 'Fn1(3)',
    },
    {
      name: 'Fn2\n(Fn3)',
      code: 'FN_MO23',
      title: 'ๆไฝไธดๆถๅๆขๅฐLayer\x202,\x20ๆพๅผๅๅฐๅฝๅLayer,\x20ๅFn1ไธ่ตทๆๅๅๆขๅฐLayer\x203',
      shortName: 'Fn2(3)',
    },
    {
      name: 'Space Fn1',
      code: 'LT(1,KC_SPC)',
      title: 'ๆไฝไธดๆถๅๆขๅฐLayer1,ๆพๅผๅๅฐๅฝๅLayer,็ญๆ=Space',
      shortName: 'Spc Fn1',
    },
    {
      name: 'Space Fn2',
      code: 'LT(2,KC_SPC)',
      title: 'ๆไฝไธดๆถๅๆขๅฐLayer2,ๆพๅผๅๅฐๅฝๅLayer,็ญๆ=Space',
      shortName: 'Spc Fn2',
    },
    {
      name: 'Space Fn3',
      code: 'LT(3,KC_SPC)',
      title: 'ๆไฝไธดๆถๅๆขๅฐLayer3,ๆพๅผๅๅฐๅฝๅLayer,็ญๆ=Space',
      shortName: 'Spc Fn3',
    },
  ];

  const menu: IKeycodeMenu = {
    label: 'ๅฑ็ฎก็้ฎ',
    width: 'label',
    keycodes: [
      {
        name: 'MO',
        code: 'MO(layer)',
        type: 'layer',
        layer: 0,
        title: 'ๅFn้ฎ\x20ๆไธไธดๆถๅๆขๅฐlayer\x20ๆพๅผๅๅฐๅฝๅๅฑ',
      },
      {
        name: 'TG',
        code: 'TG(layer)',
        type: 'layer',
        layer: 0,
        title: 'ๆไธๅๅๆขๅฐlayer\x20,ๅๆฌกๆไธๅๅฐๅฝๅๅฑ',
      },
      {
        name: 'TT',
        code: 'TT(layer)',
        type: 'layer',
        layer: 0,
        title:
          "ๅ่ฝๅMO(FN)ไธๆ ท,ไฝๆฏ่ฟๆไบไธ,ๅฐๅๆขๅฐlayer",
      },
      {
        name: 'OSL',
        code: 'OSL(layer)',
        type: 'layer',
        layer: 0,
        title: 'ไธดๆถ่งฆๅ้ฎ:่งฆๅๅไธไธไธชๆไธ็้ฎ,้ฎๅผไธบ่งฆๅ้ฎๅจlayer\x20็้ฎๅผ',
      },
      {
        name: 'TO',
        code: 'TO(layer)',
        type: 'layer',
        layer: 0,
        title: 'ๅๆขๅฐlayer',
      },
      {
        name: 'DF',
        code: 'DF(layer)',
        type: 'layer',
        layer: 0,
        title: '่ฎพ็ฝฎ้ป่ฎคๅฑไธบlayer',
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
      label: 'ๅบ็ก้ฎ',
      keycodes: [
        {name: '', code: 'KC_NO', title: '็ฉบ้ฎไฝ'},
        {name: 'โฝ', code: 'KC_TRNS', title: 'ไฟๆๅไธๅฑ็้ฎๅผ'},
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
        {name: 'Print Screen', code: 'KC_PSCR', shortName: 'Print',title:'็ณป็ป็ปไฝ ็ๆชๅพ้ฎ'},
        {name: 'Scroll Lock', code: 'KC_SLCK', shortName: 'Scroll',title:'ๆปๅจ้ๅฎ'},
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
        {name: 'Num Lock', code: 'KC_NLCK', keys: 'num', shortName: 'N.Lck',title: 'ๆฐๅญ้ๅฎ'},
        {name: 'Caps Lock', code: 'KC_CAPS', keys: 'caps_lock',width: 1750, title: 'ๅคงๅ้ๅฎ'},
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
        {name: 'รท', code: 'KC_PSLS', keys: 'num_divide', title: 'Numpad รท'},
        {name: 'ร', code: 'KC_PAST', keys: 'num_multiply', title: 'Numpad ร'},
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
        {name: 'โ', code: 'KC_LEFT', keys: 'left', shortName: 'โ'},
        {name: 'โ', code: 'KC_DOWN', keys: 'down', shortName: 'โ'},
        {name: 'โ', code: 'KC_UP', keys: 'up', shortName: 'โ'},
        {name: 'โ', code: 'KC_RGHT', keys: 'right', shortName: 'โ'},
      ],
    },
    {
      label: '็ฏๅ้ฎ',
      width: 'label',
      keycodes: [
        {name: 'ไบฎๅบฆ -', code: 'BR_DEC', title: 'ไบฎๅบฆ -'},
        {name: 'ไบฎๅบฆ +', code: 'BR_INC', title: 'ไบฎๅบฆ +'},
        {name: '็ฏๆ -', code: 'EF_DEC', title: '็ฏๆ -'},
        {name: '็ฏๆ +', code: 'EF_INC', title: '็ฏๆ +'},
        {name: '็ฏๆ\n้ๅบฆ -', code: 'ES_DEC', title: '็ฏๆ้ๅบฆ -'},
        {name: '็ฏๆ\n้ๅบฆ +', code: 'ES_INC', title: '็ฏๆ้ๅบฆ +'},
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
      label: 'ๅชไฝ้ฎ',
      width: 'label',
      keycodes: [
        {name: '้ณ้-', code: 'KC_VOLD', title: '้ณ้้ไฝ'},
        {name: '้ณ้ +', code: 'KC_VOLU', title: '้ณ้ๆ้ซ'},
        {name: '้้ณ', code: 'KC_MUTE', title: '็ต่้้ณ'},
        {name: 'ๆญๆพ/\nๆๅ', code: 'KC_MPLY', title: 'ๆญๆพ/ๆๅ'},
        {name: 'ๅคๅชไฝๅๆญข', code: 'KC_MSTP', title: 'ๅคๅชไฝๅๆญข'},
        {name: 'ไธไธ้ฆ', code: 'KC_MPRV', title: 'ไธไธ้ฆ'},
        {name: 'ไธไธ้ฆ', code: 'KC_MNXT', title: 'ไธไธ้ฆ'},
        {name: 'ๅ้', code: 'KC_MRWD', title: 'ๅ้'},
        {name: 'ๅฟซ่ฟ', code: 'KC_MFFD', title: 'ๅฟซ่ฟ'},
        {name: 'ๅฏๅจๆญๆพๅจ', code: 'KC_MSEL', title: 'ๅฏๅจ\nๆญๆพๅจ'},
        {name: 'ๅคๅชไฝๅผนๅบ', code: 'KC_EJCT', title: 'ๅคๅชไฝๅผนๅบ'},
      ],
    },
    {
      label: 'ๅฎ',
      width: 'label',
      keycodes: [
        {name: 'M0', code: 'MACRO(0)', title: 'ๆง่กๅบๅทไธบ0็ๅฎ'},
        {name: 'M1', code: 'MACRO(1)', title: 'ๆง่กๅบๅทไธบ1็ๅฎ'},
        {name: 'M2', code: 'MACRO(2)', title: 'ๆง่กๅบๅทไธบ2็ๅฎ'},
        {name: 'M3', code: 'MACRO(3)', title: 'ๆง่กๅบๅทไธบ3็ๅฎ'},
        {name: 'M4', code: 'MACRO(4)', title: 'ๆง่กๅบๅทไธบ4็ๅฎ'},
        {name: 'M5', code: 'MACRO(5)', title: 'ๆง่กๅบๅทไธบ5็ๅฎ'},
        {name: 'M6', code: 'MACRO(6)', title: 'ๆง่กๅบๅทไธบ6็ๅฎ'},
        {name: 'M7', code: 'MACRO(7)', title: 'ๆง่กๅบๅทไธบ7็ๅฎ'},
        {name: 'M8', code: 'MACRO(8)', title: 'ๆง่กๅบๅทไธบ8็ๅฎ'},
        {name: 'M9', code: 'MACRO(9)', title: 'ๆง่กๅบๅทไธบ9็ๅฎ'},
        {name: 'M10', code: 'MACRO(10)', title: 'ๆง่กๅบๅทไธบ10็ๅฎ'},
        {name: 'M11', code: 'MACRO(11)', title: 'ๆง่กๅบๅทไธบ11็ๅฎ'},
        {name: 'M12', code: 'MACRO(12)', title: 'ๆง่กๅบๅทไธบ12็ๅฎ'},
        {name: 'M13', code: 'MACRO(13)', title: 'ๆง่กๅบๅทไธบ13็ๅฎ'},
        {name: 'M14', code: 'MACRO(14)', title: 'ๆง่กๅบๅทไธบ14็ๅฎ'},
        {name: 'M15', code: 'MACRO(15)', title: 'ๆง่กๅบๅทไธบ15็ๅฎ'},
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
      label: '็นๆฎ้ฎ',
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
        {name: 'ยฅ', code: 'KC_JYEN', title: 'JPN Yen'},
        {name: '็กๅคๆ', code: 'KC_MHEN', title: 'JIS Muhenkan'},
        {name: 'ๆผขๅญ', code: 'KC_HANJ', title: 'Hanja'},
        {name: 'ํ์', code: 'KC_HAEN', title: 'HanYeong'},
        {name: 'ๅคๆ', code: 'KC_HENK', title: 'JIS Henkan'},
        {name: 'ใใช', code: 'KC_KANA', title: 'JIS Katakana/Hiragana'},
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
        {name: '้็ฝฎ/\n่ฟDFU', code: 'RESET', title: 'Reset the keyboard'},
        {name: 'ๅผๅฏ\n่ฐ่ฏ', code: 'DEBUG', title: 'Toggle debug mode'},
        {
          name: 'ๅผๅฏ\nๅจ้ฎๆ ๅฒ',
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
        {name: '่ฎก็ฎๅจ', code: 'KC_CALC'},
        {name: '้ฎไปถ', code: 'KC_MAIL'},
        {name: 'ๅธฎๅฉ', code: 'KC_HELP'},
        {name: 'Stop', code: 'KC_STOP'},
        {name: 'Alt Erase', code: 'KC_ERAS'},
        {name: 'Again', code: 'KC_AGAIN'},
        {name: 'Menu', code: 'KC_MENU'},
        {name: 'Undo', code: 'KC_UNDO'},
        {name: 'Select', code: 'KC_SELECT'},
        {name: 'Exec', code: 'KC_EXECUTE'},
        {name: 'ๅชๅ', code: 'KC_CUT'},
        {name: 'ๅคๅถ', code: 'KC_COPY'},
        {name: '็ฒ่ดด', code: 'KC_PASTE'},
        {name: 'Find', code: 'KC_FIND'},
        {name: 'ๆๅผ่ฎก็ฎๆบ', code: 'KC_MYCM'},
        {name: 'ๆต่งๅจ้ฆ้กต', code: 'KC_WWW_HOME'},
        {name: 'ๆต่งๅจ่ฟๅ', code: 'KC_WWW_BACK'},
        {name: 'ๆต่งๅจๅ่ฟ', code: 'KC_WWW_FORWARD'},
        {name: 'ๆต่งๅจๅๆญข่ฝฝๅฅ', code: 'KC_WWW_STOP'},
        {name: 'ๆต่งๅจๅทๆฐ', code: 'KC_WWW_REFRESH'},
        {name: 'ๆต่งๅจๆถ่ๅคน', code: 'KC_WWW_FAVORITES'},
        {name: 'ๆต่งๅจๆ็ดข', code: 'KC_WWW_SEARCH'},
        {
          name: 'ๅฑๅนไบฎๅบฆ +',
          code: 'KC_BRIU',
          shortName: 'Scr +',
          title: 'ๅฑๅนไบฎๅบฆๆ้ซ',
        },
        {
          name: 'ๅฑๅนไบฎๅบฆ -',
          code: 'KC_BRID',
          shortName: 'Scr -',
          title: 'ๅฑๅนไบฎๅบฆ้ไฝ',
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
        {name: '้ผ ๆ  โ', code: 'KC_MS_UP'},
        {name: '้ผ ๆ  โ', code: 'KC_MS_DOWN'},
        {name: '้ผ ๆ  โ', code: 'KC_MS_LEFT'},
        {name: '้ผ ๆ  โ', code: 'KC_MS_RIGHT'},
        {name: '้ผ ๆ \nๅทฆ้ฎ', code: 'KC_MS_BTN1'},
        {name: '้ผ ๆ \nๅณ้ฎ', code: 'KC_MS_BTN2'},
        {name: '้ผ ๆ \nไธญ้ฎ', code: 'KC_MS_BTN3'},
        {name: '้ผ ๆ \nๅ้้ฎ', code: 'KC_MS_BTN4'},
        {name: '้ผ ๆ \nๅ่ฟ้ฎ', code: 'KC_MS_BTN5'},
        {name: 'Mouse Btn6', code: 'KC_MS_BTN6'},
        {name: 'Mouse Btn7', code: 'KC_MS_BTN7'},
        {name: 'Mouse Btn8', code: 'KC_MS_BTN8'},
        {name: '้ผ ๆ ๆป่ฝฎโ', code: 'KC_MS_WH_UP'},
        {name: '้ผ ๆ ๆป่ฝฎโ โ', code: 'KC_MS_WH_DOWN'},
        {name: '้ผ ๆ ๆป่ฝฎโ โ', code: 'KC_MS_WH_LEFT'},
        {name: '้ผ ๆ ๆป่ฝฎโ โ', code: 'KC_MS_WH_RIGHT'},
        {name: 'ๆไฝๆถ้ผ ๆ ๆข้็งปๅจ', code: 'KC_MS_ACCEL0'},
        {name: 'ๆไฝๆถ้ผ ๆ ไธญ้็งปๅจ', code: 'KC_MS_ACCEL1'},
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
      label: 'QMK็ฏๆง้ฎ',
      width: 'label',
      keycodes: [
        {name: 'LED\n็ฏๅผๅณ', code: 'BL_TOGG', title: 'LED่ฝด็ฏๅผๅณ'},
        {name: 'LED\nๅผ', code: 'BL_ON', title: 'LED็ฏๆๅณ'},
        {name: 'LED\nๅณ', code: 'BL_OFF', shortName: 'BL Off', title: 'LED็ฏๅณ้ญ'},
        {name: 'LED็ฏไบฎๅบฆ-', code: 'BL_DEC', title: 'LED่ฝด็ฏไบฎๅบฆ้ไฝ'},
        {name: 'LED็ฏไบฎๅบฆ+', code: 'BL_INC', title: 'LED่ฝด็ฏไบฎๅบฆๆ้ซ'},
        {name: 'LED็ฏไบฎๅบฆ\nๅพช็ฏ', code: 'BL_STEP', title: 'LED่ฝด็ฏไบฎๅบฆๅพช็ฏ'},
        {name: 'LED็ฏๅผๅธ\n็ฏๆ', code: 'BL_BRTG', title: 'LED็ฏๅผๅธ็ฏๆๅผๅณ'},
        {name: 'RGB\n็ฏๅผๅณ', code: 'RGB_TOG', title: 'RGB็ฏๅผๅณ'},
        {name: 'RGB\nๆจกๅผ-', code: 'RGB_RMOD', title: 'RGBๆจกๅผๅๅๅๆข'},
        {name: 'RGB\nๆจกๅผ+', code: 'RGB_MOD', title: 'RGBๆจกๅผๅๅๅๆข'},
        {name: 'RGB\n่ฒ็ธ-', code: 'RGB_HUD', title: 'RGB็ฏ่ฒ็ธๅ'},
        {name: 'RGB\n่ฒ็ธ+', code: 'RGB_HUI', title: 'RGB็ฏ่ฒ็ธๅ '},
        {name: 'RGB\n้ฅฑๅๅบฆ-', code: 'RGB_SAD', title: 'RGB้ฅฑๅๅบฆๅ'},
        {name: 'RGB\n้ฅฑๅๅบฆ+', code: 'RGB_SAI', title: 'RGB้ฅฑๅๅบฆๅ '},
        {name: 'RGB็ฏ\nไบฎๅบฆ-', code: 'RGB_VAD', title: 'RGB็ฏไบฎๅบฆๅ'},
        {name: 'RGB็ฏ\nไบฎๅบฆ+', code: 'RGB_VAI', title: 'RGB็ฏไบฎๅบฆๅ '},
        {name: 'RGB\n็ฏๆ\n้ๅบฆ-', code: 'RGB_SPD', title: 'RGB็ฏๆ้ๅบฆ้ไฝ'},
        {name: 'RGB\n็ฏๆ\n้ๅบฆ+', code: 'RGB_SPI', title: 'RGB็ฏๆ้ๅบฆๆ้ซ'},
        {name: 'RGB\n้ๆ\n็ฏๆ', code: 'RGB_M_P', title: 'RGB้ๆ็ฏๆ'},
        {name: 'RGB\nๅผๅธ\n็ฏๆ', code: 'RGB_M_B', title: 'RGB\nๅผๅธ็ฏๆ'},
        {name: 'RGB ๅฝฉ่น็ฏๆๅ่ฒๆธๅ', code: 'RGB_M_R', title: 'RGB ๅฝฉ่น็ฏๆๅ่ฒๆธๅ'},
        {name: 'RGB ๅฝฉ่น็ฏๆๅฝฉ่ฒๆธๅ', code: 'RGB_M_SW', title: 'RGB ๅฝฉ่น็ฏๆๅฝฉ่ฒๆธๅ'},
        {name: 'RGB ่ดชๅ่็ฏๆ', code: 'RGB_M_SN', title: 'RGB ่ดชๅ่็ฏๆ'},
        {name: 'RGB ้น้ณๆธธไพ ็ฏๆ', code: 'RGB_M_K', title: 'RGB ้น้ณๆธธไพ ็ฏๆ'},
        {name: 'RGB ๅฃ่ฏ็ฏๆ', code: 'RGB_M_X', title: 'RGB ๅฃ่ฏ็ฏๆ'},
        {name: 'RGB\n้ๆๆขฏๅบฆ็ฏๆ', code: 'RGB_M_G', title: 'RGB ้ๆๆขฏๅบฆ็ฏๆ'},
      ],
    },
    {
      label: 'ไธ่ฝ็ปๅ้ฎ',
      width: 'label',
      keycodes: [
        {name: 'ๅทฆCtrl+Alt', code: 'LCA_T', title: 'ๅทฆCtrl+ๅทฆAlt'},
        {name: 'ๅทฆShift+Alt', code: 'LAS_T', title: 'ๅทฆShift+Alt'},
        {name: 'ๅทฆCtrl+Shift', code: 'LCS_T', title: 'ๅทฆCtrl+ๅทฆShift'},
        {name: 'ๅทฆShift+Shift+Alt', code: 'LCSA_T', title: 'ๅทฆShift+Shift+Alt'},
        {name: 'ๅทฆShift+Alt+Win', code: 'LCAW_T', title: 'ๅทฆShift+Alt+Win'},
        {name: 'ๅทฆShift+Win', code: 'LSW_T', title: 'ๅทฆShift+Win'},
        {name: 'ๅทฆShift+Shift+Win', code: 'LCSW_T', title: 'ๅทฆShift+Shift+Win'},
        {name: 'ๅทฆShift+Alt+Win', code: 'LSAW_T', title: 'ๅทฆShift+Alt+Win'},
        {name: 'ๅทฆCtrl+Shift+Alt+Win', code: 'LCSAW_T', title: 'ๅทฆCtrl+Shift+Alt+Win'},
      ],
    },
    {
      label: 'PSๅฟซๆท้ฎ',
      width: 'label',
      keycodes: [
        {name: 'ๆๅผ', code: 'C_KC_O', title: 'Ctrl+O'},
        {name: 'ๆฐๅปบ', code: 'C_KC_N', title: 'Ctrl+N'},
        {name: 'ๅคๅถๅพๅฑ', code: 'C_KC_J', title: 'Ctrl+J'},
        {name: 'ๅกซๅ่ๆฏ่ฒ', code: 'C_KC_del', title: 'Ctrl+Delte'},
        {name: 'ๅกซๅๅๆฏ่ฒ', code: 'A_KC_del', title: 'Alt+Delete'},
        {name: 'ๅญๅจไธบ', code: 'CS_KC_S', title: 'Ctrl+Shift+S'},
        {name: 'RAWๆปค้', code: 'CS_KC_A', title: 'Ctrl+Shift+A'},
        {name: '็พฝๅ', code: 'S_KC_F6', title: 'Shift+F6'},
        {name: '่ฒ้ถ', code: 'C_KC_L', title: 'Ctrl+L'},
        {name: 'ๆฒ็บฟ', code: 'C_KC_M', title: 'Ctrl+M'},
        {name: 'ๅ็ธ', code: 'C_KC_I', title: 'Ctrl+I'},
        {name: 'ๆพ็คบๆ ๅฐบ', code: 'C_KC_R', title: 'Ctrl+R'},
        {name: 'ๅทฅไฝๅบ็ผฉๅฐ', code: 'C_KC_1', title: 'Ctrl+-'},
        {name: 'ๅทฅไฝๅบๆพๅคง', code: 'C_KC_2', title: 'Ctrl++'},
        {name: 'ๅกซๅ', code: 'S_KC_F5', title: 'Shift+F5'},
        {name: 'ๆฐๅปบๅพๅฑ', code: 'CS_KC_N', title: 'Ctrl+Shift+N'},
        {name: 'ๅป่ฒ', code: 'CS_KC_U', title: 'Ctrl+Shift+U'},
        {name: '่ฟๅไธคๆญฅๆไฝ', code: 'AC_KC_Z', title: 'Alt+Ctrl+Z'},
        {name: 'ๅ้', code: 'CS_KC_I', title: 'Ctrl+Shift+I'},
        {name: '้ๅไธไธๆญฅ', code: 'CS_KC_Z', title: 'Ctrl+Shift+Z'},
        {name: 'ๅฟซๆท้ฎ่ฎพ็ฝฎ', code: 'ACS_KC_K', title: 'Alt+Ctrl+Shift+K'},
        {name: '้ๅคไธไธๆญฅ', code: 'ACS_KC_T', title: 'Alt+Ctrl+Shift+T'},
        {name: 'ๆฐๅปบ็ๅฐๅพๅฑ', code: 'ACS_KC_E', title: 'Alt+Ctrl+Shift+E'},
        {name: 'ๅๅนถๅฏ่งๅพๅฑ', code: 'CS_KC_E', title: 'Ctrl+Shift+E'},
        {name: 'ๅไธๅๅนถๅพๅฑ', code: 'C_KC_E', title: 'Ctrl+E'},
        {name: 'ๆฐๅปบ็ๅฐๅพๅฑ', code: 'AS_KC_S', title: 'Shift+Alt+S'},
        {name: 'ไธ็งปไธๅฑ', code: 'C_KC_LB', title: 'Ctrl+['},
        {name: 'ไธ็งปไธๅฑ', code: 'C_KC_RB', title: 'Ctrl+]'},
        {name: '็งปๅฐๆๅบๅฑ', code: 'CS_KC_LB', title: 'Ctrl+Shift+]'},
        {name: '็งปๅฐๆ้กถๅฑ', code: 'CS_KC_RB', title: 'Ctrl+Shift+]'},
        {name: 'ๆดๅค่ฏทไฝฟ็จไธ่ฝ้ฎ', code: '_KC_', title: 'ๆดๅค่ฏทไฝฟ็จไธ่ฝ้ฎ๏ผๆฌข่ฟๆไพๆดๅคๅธธ็จๅฟซๆท้ฎ.......ๆฑๅไฝ่๏ผ้ๆบๅค่ฏป็ๅค่ฏปๅงฌ'},
      ],
    },
    {
      label: 'AIๅฟซๆท้ฎ',
      width: 'label',
      keycodes: [
        {name: 'ๆๅผ', code: 'C_KC_O', title: 'Ctrl+O'},
        {name: 'ๆฐๅปบ', code: 'C_KC_N', title: 'Ctrl+N'},
        {name: '่ดดๅจๅ้ข', code: 'C_F', title: 'Ctrl+F'},
        {name: '่ดดๅจๅ้ข', code: 'C_B', title: 'Ctrl+B'},
        {name: 'ๅไฝ็ฒ่ดด', code: 'SC_B', title: 'Shift+Ctrl+B'},
        {name: 'ๅไฝ็ฒ่ดด', code: 'ASC_B', title: 'Alt+Shift+Ctrl+B'},
        {name: '้ข่ฒ่ฎพ็ฝฎ', code: 'SC_K', title: 'Shift+Ctrl+K'},
        {name: '้ฎ็ๅฟซๆท้ฎ', code: 'ASC_K', title: 'Alt+Shift+Ctrl+K'},
        {name: 'ๅญๅจๅฏๆฌ', code: 'AC_S', title: 'Alt+Ctrl+S'},
        {name: '้ๆฉไธๆนๅฏน่ฑก', code: 'AC_RB', title: 'Alt+Ctrl+]'},
        {name: '้ๆฉไธๆนๅฏน่ฑก', code: 'AC_LB', title: 'Alt+Ctrl+['},
        {name: '็ผ็ป้ๆฉ็ป็จฟ', code: 'C_G', title: 'Ctrl+G'},
        {name: 'ๅๆถ้ไธญ็็ป็จฟ็ป', code: 'SC_G', title: 'Shift+Ctrl+G'},
        {name: '้ๅฎ้ๆฉๅฏน่ฑก', code: 'C_2', title: 'Ctrl+2'},
        {name: '่งฃ้ๆ้ๅฏน่ฑก', code: 'AC_2', title: 'Alt+Ctrl+2'},
        {name: '้ๅฎๆๆๅๆถ้ๆฉ็ๅฏน่ฑก', code: 'ASC_2', title: 'Alt+Shift+Ctrl+2 ้ๅฎๆๆๅๆถ้ๆฉ็ๅฏน่ฑก'},
        {name: '้่ๆ้ๅฏน่ฑก', code: 'C_3', title: 'Ctrl+3'},
        {name: 'ๆพ็คบๆ้ๅฏน่ฑก', code: 'AC_3', title: 'Alt+Ctrl+3'},
        {name: 'ๅๅปบๅคๅ่ทฏๅพ', code: 'C_8', title: 'Ctrl+8'},
        {name: 'ๅๅปบๅคๅ่ทฏๅพ', code: 'AC_8', title: 'Alt+Ctrl+8'},
        {name: 'ๆทปๅ ๅพๅฑ', code: 'C_L', title: 'Ctrl+L'},
        {name: 'ๆดๅค่ฏทไฝฟ็จไธ่ฝ้ฎ', code: '_KC_', title: 'ๆดๅค่ฏทไฝฟ็จไธ่ฝ้ฎ๏ผๆฌข่ฟๆไพๆดๅคๅธธ็จๅฟซๆท้ฎ.......ๆฑๅไฝ่๏ผ้ๆบๅค่ฏป็ๅค่ฏปๅงฌ'},
      ],
    },
    {
      label: 'PR/่พพ่ฌๅฅ',
      width: 'label',
      keycodes: [
        {name: 'ๆๅผ', code: 'C_KC_O', title: 'Ctrl+O'},
        {name: 'ๆฐๅปบ', code: 'C_KC_N', title: 'Ctrl+N'},
        {name: 'ๆดๅค่ฏทไฝฟ็จไธ่ฝ้ฎ', code: '_KC_', title: 'ๆดๅค่ฏทไฝฟ็จไธ่ฝ้ฎ๏ผๆฌข่ฟๆไพๆดๅคๅธธ็จๅฟซๆท้ฎ.......ๆฑๅไฝ่๏ผ้ๆบๅค่ฏป็ๅค่ฏปๅงฌ'},
      ],
    },
    /*
     These custom keycodes always exist and should be filtered out if necessary
     Name and Title should be replaced with the correct ones from the keyboard json
    */
    {
      label: '่ชๅฎไน้ฎไฝ',
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
