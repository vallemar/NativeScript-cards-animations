<script lang="ts" setup>
import {ref, Ref, toRaw,} from "nativescript-vue";

import {
  GestureHandlerStateEvent as NSGestureHandlerStateEvent,
  GestureHandlerTouchEvent as NSGestureHandlerTouchEvent,
  GestureStateEventData as NSGestureStateEventData,
  GestureTouchEventData as NSGestureTouchEventData,
  HandlerType as NSHandlerType,
  Manager as NSManager
} from '@nativescript-community/gesturehandler';
import {CoreTypes, View} from "@nativescript/core";
import {ItemCard, Direction, GestureState} from "~/types";
import ActionButton from "~/components/ActionButton.vue";
import {dataCard} from "~/constant";


const cards = ref(dataCard.reverse()) as Ref<ItemCard[]>
const currentView = ref(cards.value.length - 1)

const manager = NSManager.getInstance();
const gestureHandler = manager.createGestureHandler(NSHandlerType.PAN, 10, {
  shouldCancelWhenOutside: false
});

gestureHandler.on(NSGestureHandlerTouchEvent, onGestureTouch as () => void);
gestureHandler.on(NSGestureHandlerStateEvent, onGestureState as () => void);

const getTranslateX = (index: number) => 0 // for alternate => index === (cards.value.length - 1) ? 0 : index % 2 === 0 ? 4 : -4;

const normalizeRange = (val: number, max: number, min: number) => (val - min) / (max - min);
const getScale = (index: number) => {
  const position = cards.value.length - currentView.value + index;
  return normalizeRange(position, cards.value.length, 0)  //(cards.value.length - currentView.value + index) * 0.1
};
const getTranslateY = (index: number) => {
  const position = cards.value.length - currentView.value + index;
  const normalized = normalizeRange(position, 0 , cards.value.length) * 300
  return normalized === 0 ? 0 : normalized
};

const like = () => outCard(cards.value[currentView.value], Direction.Right);
const discard = () => outCard(cards.value[currentView.value], Direction.Left)
const isFirstCard = (index: number) => (index === cards.value.length - 1)

function resetAllCard() {
  currentView.value = cards.value.length - 1;
  cards.value.forEach((card: ItemCard, index) => {
    resetCard(card, index)
    if (isFirstCard(index)) {
      gestureHandler.attachToView(toRaw(card.view));
    }
    // applyTranslateY();
  })
}

function resetCard(card: ItemCard, indexView: number) {
  toRaw(card.view).animate({
    rotate: {
      x: 0,
      y: 0,
      z: 0
    },
    translate: {
      x: getTranslateX(indexView),
      y: getTranslateY(indexView)
    },
    scale: {
      x: getScale(indexView),
      y: getScale(indexView)
    },
    duration: 250,
    curve: CoreTypes.AnimationCurve.cubicBezier(0.17, 0.89, 0.24, 1.11)
  })

}

function applyTranslateY() {
  for (let index = 0; index < (currentView.value + 1); index++) {
    const card = cards.value[index];

    if (index <= currentView.value) {
      toRaw(card.view).animate({
        translate: {
          y: getTranslateY(index),
          x: 0
        },
        scale: {
          x: getScale(index),
          y: getScale(index)
        },

        duration: 250,
      })
    }
  }

  console.log("applyTranslateY")
}

function outCard(card: ItemCard, direction: Direction) {
  toRaw(card.view).animate({
    translate: {
      x: direction === Direction.Left ? -500 : 500,
      y: 50
    },
    duration: 250
  })
  currentView.value = currentView.value - 1
  if (currentView.value >= 0) {
    gestureHandler.attachToView(toRaw(cards.value[currentView.value].view) as View);
    applyTranslateY();
  } else {
    //finish
    setTimeout(() => {
      resetAllCard()
    }, 1000)
  }
}

function onGestureTouch(args: NSGestureTouchEventData) {
  const {state, extraData, view} = args.data;
  if (view) {
    view.translateX = extraData.translationX + getTranslateX(currentView.value);
    view.translateY = extraData.translationY + getTranslateY(currentView.value);
    view.rotate = (extraData.translationX * 0.1);
  }
}

function onGestureState(args: NSGestureStateEventData) {
  const {state, prevState, extraData, view} = args.data;
  if (state === GestureState.END) {
    const card = cards.value[currentView.value]
    if (extraData.translationX >= 200 || extraData.translationX <= -200) {
      outCard(card, extraData.translationX >= 200 ? Direction.Right : Direction.Left)
    } else {
      resetCard(card, currentView.value);
    }
  }
}

function loadedCard(args: { object: View }, index: number) {
  cards.value[index].view = args.object
  args.object.scaleY = getScale(index)
  args.object.scaleX = getScale(index)
  if (isFirstCard(index)) {
    gestureHandler.attachToView(args.object);
  }
}
</script>

<template>
  <Frame>
    <Page actionBarHidden="true" androidStatusBarBackground="#1F232B" class="bg-[#1F232B]">
      <GridLayout rows="*, 150" class="flex-col">
        <GridLayout class="100%">
          <GestureRootView>
            <Image
                verticalAlignment="center"
                v-for="(card, index) in cards" :key="index"
                @loaded="loadedCard($event, index)"
                stretch="aspectFill"
                height="500"
                width="90%"
                class="rounded-3xl mt-20"
                :src="card.img"

                :translateY="getTranslateY(index)"
                :translateX="getTranslateX(index)"
            />
          </GestureRootView>
        </GridLayout>

        <FlexboxLayout row="1" class="justify-around  items-center  rounded-t-[28]">
          <ActionButton @tap="discard" class="h-[80] w-[80]" icon="close"/>
          <ActionButton @tap="resetAllCard" class="h-[56] w-[56]" icon="refresh"/>
          <ActionButton @tap="like" class="h-[80] w-[80]" icon="favorite"/>
        </FlexboxLayout>
      </GridLayout>
    </Page>
  </Frame>
</template>

