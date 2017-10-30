/**
 *  drag and drop based on html5
 *  @author SunZhengJie
 *  @email 200765821@qq.com
 */

import store from '../store/index'
import {
  deepCopy
} from '../util/assist'
import {
  generateUid,
  findSoulByCid,
  findSoulByCTypeUp
} from '../helper/soul_helper'
import {
  drop
} from './assemble'

function onDragStart(e) {
  store.commit('dragModule/setDragElement', e.target)
  return true;
}

function onDrag(e) {
  return true
}

function onDragEnd(e) {
  e.preventDefault();
  store.commit('dragModule/setDragElement', null)
  return true
}

function onDragEnter(e) {
  e.preventDefault()
  e.stopPropagation()
  return true
}

function onDragOver(e) {
  e.preventDefault()
  e.stopPropagation()

  const drag = store.getters['dragModule/dragElement'];

  if (validateDrop(drag, this)) {
    markDrop(this, true)
  }

  return true;
}

function onDragLeave(e) {
  e.preventDefault()
  e.stopPropagation()
  markDrop(this, false)
  return true;
}

function validateDrop(drag, drop) {
  if (!drag) {
    return false
  }

  if (drag.controlConfig.allowPlace) {
    //优先处理allow_place: FormItem只能放在Form里面
    return drag.controlConfig.allowPlace.indexOf(drop.controlConfig.cid) > -1;

  } else {
    if (!drop || !drop.controlConfig.allow) {
      return false

    } else if (drop.controlConfig.allow && drop.controlConfig.allow.length === 0) {
      return true

    } else if (drop.controlConfig.allow.indexOf(drag.controlConfig.cid) > -1) {
      return true
    }
  }
}

function markDrop(drop, mark) {
  if (mark) {
    if (!drop.classList.contains('drop')) {
      drop.classList.add('drop')
    }
  } else {
    drop.classList.remove('drop')
  }
}

function isFormItem(drag) {
  switch (drag.type) {
    case 'Input':
    case 'CheckboxGroup':
    case 'RadioGroup':
    case 'Select':
      return true;
    default:
      return false;
  }
}

function interceptDrop(saveInfo) {
  if (saveInfo.drag.type === 'AppFrame') {
    let dropPanelSoul = findSoulByCid(100, store.getters['dragModule/draggableControls'])
    dropPanelSoul.uid = generateUid()
    saveInfo.drag.children.push(deepCopy(dropPanelSoul))
    store.commit('dragModule/setSoul', saveInfo.drag)

  } else if (saveInfo.drag.type === 'WrapCard') {
    let dropPanelSoul = findSoulByCid(100, store.getters['dragModule/draggableControls'])
    for (let i = 0; i < 3; i++) {
      let copy = deepCopy(dropPanelSoul)
      copy.uid = generateUid()
      saveInfo.drag.children.push(copy)
    }
  } else if (isFormItem(saveInfo.drag)) {
    saveInfo.drag._beforeCreate = (soul) => {
      let form = findSoulByCTypeUp('Form', saveInfo.drag,soul);
      form.model.model.value[saveInfo.drag.model.formKey.value] = saveInfo.drag.model.value.value
      let copy = saveInfo.drag.model.formKey.value
      Object.defineProperty(saveInfo.drag.model.formKey, 'value', {
        set: (n) => {
          console.log(form.model.model.value)
          delete form.model.model.value[saveInfo.drag.model.formKey.value]
          form.model.model.value[n] = saveInfo.drag.model.value.value
          copy = n
        },
        get: () => {
          return copy
        }
      })

      let copyValue = saveInfo.drag.model.value.value
      Object.defineProperty(saveInfo.drag.model.value, 'value', {
        set: (n) => {
          console.log(n)
          form.model.model.value[saveInfo.drag.model.formKey.value] = n
          copyValue = n
        },
        get: () => {
          return copyValue
        }
      })
    }

    saveInfo.drag._beforeCreate()
  }
}

function onDrop(e) {
  e.stopPropagation();
  e.preventDefault();

  const drag = store.getters['dragModule/dragElement'];

  if (!validateDrop(drag, this)) {
    return false;
  }

  let uid = generateUid()
  let copy = deepCopy(drag.controlConfig)
  copy.uid = uid

  const saveInfo = {
    drag: copy,
    drop: this.controlConfig
  }
  saveInfo.drag.pid = saveInfo.drop.uid

  interceptDrop(saveInfo)

  drop(saveInfo)

  markDrop(this, false)
  return true;
}

function initDropEvents(drag) {
  drag.ondragenter = onDragEnter
  drag.ondragover = onDragOver
  drag.ondrop = onDrop
  drag.ondragleave = onDragLeave
}

export {
  onDragStart,
  onDrag,
  onDragEnd,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragLeave,
  initDropEvents,
  interceptDrop,
  isFormItem
}
