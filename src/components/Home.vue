<script lang="ts" setup>
import { ref, Ref, toRaw, computed } from 'nativescript-vue';

import {
  GestureHandlerStateEvent as NSGestureHandlerStateEvent,
  GestureHandlerTouchEvent as NSGestureHandlerTouchEvent,
  GestureStateEventData as NSGestureStateEventData,
  GestureTouchEventData as NSGestureTouchEventData,
  HandlerType as NSHandlerType,
  Manager as NSManager,
  PanGestureHandler,
} from '@nativescript-community/gesturehandler';
import { CoreTypes, View, isIOS, Screen } from '@nativescript/core';
import { ItemCard, Direction, GestureState, CardStatus } from '~/types';
import ActionButton from '~/components/ActionButton.vue';
import { dataCard } from '~/constant';

const cards = ref(dataCard.reverse()) as Ref<ItemCard[]>;
const currentView = ref(cards.value.length - 1);

const currentIconStatus = computed(() =>
  cards.value[currentView.value]?.status == CardStatus.ToExitLeft
    ? { icon: 'thumb_down', color: '#ff6961' }
    : cards.value[currentView.value]?.status == CardStatus.ToExitRight
    ? { icon: 'thumb_up', color: '#77dd77' }
    : null
);

const manager = NSManager.getInstance();
let gestureHandler: PanGestureHandler = null!;
let cardViews = 0;

const getGestureHandler = () => {
  gestureHandler = manager.createGestureHandler(NSHandlerType.PAN, cardViews++);

  gestureHandler.on(NSGestureHandlerTouchEvent, onGestureTouch as () => void);
  gestureHandler.on(NSGestureHandlerStateEvent, onGestureState as () => void);
  return gestureHandler;
};

const getScale = (index: number) =>
  normalizeRange(currentPosition(index), cards.value.length, 0);
const getTranslateY = (index: number) =>
  normalizeRange(currentPosition(index), 0, cards.value.length) * 300;
const normalizeRange = (val: number, max: number, min: number) =>
  (val - min) / (max - min);
const currentPosition = (index: number) =>
  cards.value.length - currentView.value + index;
const isFirstCard = (index: number) => index === cards.value.length - 1;
const hasMoreCards = () => currentView.value >= 0;
const like = () => outCard(cards.value[currentView.value], Direction.Right);
const discard = () => outCard(cards.value[currentView.value], Direction.Left);

function resetAllCard() {
  gestureHandler.detachFromView();
  currentView.value = cards.value.length - 1;
  cards.value.forEach((card: ItemCard, index) => {
    resetCard(card, index);
    card.status = CardStatus.Back;
    if (isFirstCard(index)) {
      card.status = CardStatus.Front;
      getGestureHandler().attachToView(toRaw(card.view));
    }
  });
}

function resetCard(card: ItemCard, indexView: number) {
  toRaw(card.view).animate({
    rotate: 0,
    translate: {
      x: 0,
      y: getTranslateY(indexView),
    },
    scale: {
      x: getScale(indexView),
      y: getScale(indexView),
    },
    duration: 250,
    curve: CoreTypes.AnimationCurve.cubicBezier(0.17, 0.89, 0.24, 1.2),
  });
}

function applyTranslateY() {
  for (let index = 0; index < currentView.value + 1; index++) {
    const card = cards.value[index];
    if (index <= currentView.value) {
      toRaw(card.view).animate({
        translate: {
          x: 0,
          y: getTranslateY(index),
        },
        scale: {
          x: getScale(index),
          y: getScale(index),
        },
        duration: 250,
      });
    }
  }
}

function outCard(card: ItemCard, direction: Direction) {
  if (hasMoreCards()) {
    const width =
      toRaw(card.view).getActualSize().width / 2 + Screen.mainScreen.widthDIPs;
    toRaw(card.view).animate({
      rotate: direction === Direction.Left ? -40 : 40,
      translate: {
        x: direction === Direction.Left ? -width : width,
        y: 100,
      },
      duration: 250,
    });

    gestureHandler.detachFromView();
    card.status = Direction.Left ? CardStatus.ExitLeft : CardStatus.ExitRight;
    currentView.value = currentView.value - 1;
    if (currentView.value >= 0) {
      getGestureHandler().attachToView(
        toRaw(cards.value[currentView.value].view)
      );
      cards.value[currentView.value].status = CardStatus.Front;
      applyTranslateY();
    } else {
      //finish
    }
  }
}

function onGestureTouch(args: NSGestureTouchEventData) {
  const { state, extraData, view } = args.data;
  if (view) {
    view.translateX = extraData.translationX;
    view.translateY = extraData.translationY + getTranslateY(currentView.value);
    view.rotate = extraData.translationX * (isIOS ? 0.02 : 0.1);

    if (state !== GestureState.END) {
      cards.value[currentView.value].status =
        extraData.translationX == 0
          ? CardStatus.Front
          : extraData.translationX > 0
          ? CardStatus.ToExitRight
          : CardStatus.ToExitLeft;
    }
  }
}

function onGestureState(args: NSGestureStateEventData) {
  const { state, prevState, extraData, view } = args.data;
  if (state === GestureState.END) {
    const card = cards.value[currentView.value];
    const limitOffset = Screen.mainScreen.widthDIPs / 2;
    if (
      extraData.translationX >= limitOffset ||
      extraData.translationX <= -limitOffset
    ) {
      outCard(
        card,
        extraData.translationX >= limitOffset ? Direction.Right : Direction.Left
      );
    } else {
      resetCard(card, currentView.value);
      card.status = CardStatus.Front;
    }
  }
}

function loadedCard(args: { object: View }, index: number) {
  if (!cards.value[index].view) {
    cards.value[index].view = args.object;
    args.object.scaleY = getScale(index);
    args.object.scaleX = getScale(index);
    if (isFirstCard(index)) {
      getGestureHandler().attachToView(args.object);
    }
  }
}
</script>

<template>
  <Frame>
    <Page
      actionBarHidden="true"
      androidStatusBarBackground="#1F232B"
      class="bg-[#1F232B]"
    >
      <GridLayout rows="*, 150" class="flex-col">
        <GridLayout class="100%">
          <GridLayout
            v-for="(card, index) in cards"
            :key="index"
            @loaded="loadedCard($event, index)"
            height="70%"
            width="90%"
            :translateY="getTranslateY(index)"
            class="rounded-3xl"
          >
            <Image
              stretch="aspectFill"
              height="100%"
              width="100%"
              class="rounded-3xl"
              :src="card.img"
            />
            <Label
              verticalAlignment="center"
              horizontalAlignment="center"
              style="font-size: 28"
              class="m-icon-round bg-[#1F232B]/60 p-2 rounded-full text-white"
              :color="currentIconStatus?.color"
              :hidden="!currentIconStatus || card.status === CardStatus.Back"
              :text="currentIconStatus?.icon"
            ></Label>
          </GridLayout>
        </GridLayout>
        <FlexboxLayout row="1" class="justify-around items-center">
          <ActionButton @tap="discard" class="h-[80] w-[80]" icon="close" />
          <ActionButton
            @tap="resetAllCard"
            class="h-[56] w-[56]"
            icon="refresh"
          />
          <ActionButton @tap="like" class="h-[80] w-[80]" icon="favorite" />
        </FlexboxLayout>
      </GridLayout>
    </Page>
  </Frame>
</template>
