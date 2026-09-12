<script setup lang="ts">
import { ref } from 'vue';
import * as overlays from '@wow-two-beta/ui-vue/presentation/overlays';
import { Button } from '@wow-two-beta/ui-vue/presentation/actions';
import Demo from '../gallery/Demo.vue';
import AutoGroup from '../gallery/AutoGroup.vue';

const {
  Modal,
  ModalTrigger,
  ModalContent,
  AlertModal,
  AlertModalContent,
  AlertModalAction,
  AlertModalCancel,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  HoverCardArrow,
  ActionSheet,
  ActionSheetAction,
  ActionSheetCancel,
  BottomSheet,
  BackdropOverlay,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} = overlays;

const covered = [
  'Modal',
  'ModalTrigger',
  'ModalContent',
  'AlertModal',
  'AlertModalContent',
  'AlertModalAction',
  'AlertModalCancel',
  'Drawer',
  'DrawerTrigger',
  'DrawerContent',
  'Popover',
  'PopoverTrigger',
  'PopoverContent',
  'PopoverArrow',
  'HoverCard',
  'HoverCardTrigger',
  'HoverCardContent',
  'HoverCardArrow',
  'ActionSheet',
  'ActionSheetAction',
  'ActionSheetCancel',
  'BottomSheet',
  'BackdropOverlay',
  'ModalHeader',
  'ModalTitle',
  'ModalDescription',
  'ModalBody',
  'ModalFooter',
  'ModalClose',
  'DialogHeader',
  'DialogTitle',
  'DialogDescription',
  'DialogBody',
  'DialogFooter',
  'DialogClose',
  'DrawerHeader',
  'DrawerTitle',
  'DrawerDescription',
  'DrawerBody',
  'DrawerFooter',
  'DrawerClose',
  'BottomSheetTitle',
  'BottomSheetDescription',
];

/* Every overlay opens from a trigger — a permanently-open panel proves the
   markup renders but never that the open/close path works, which is the part a
   port breaks. Drawer sides get one button each. */
const drawerSide = ref<'left' | 'right' | 'top' | 'bottom'>('right');
const drawerOpen = ref(false);
const alertOpen = ref(false);
const sheetOpen = ref(false);
const bottomOpen = ref(false);
const backdropOn = ref(false);

function openDrawer(side: 'left' | 'right' | 'top' | 'bottom') {
  drawerSide.value = side;
  drawerOpen.value = true;
}
</script>

<template>
  <div class="space-y-6">
    <h2 class="font-mono text-sm font-bold uppercase tracking-wide">overlays</h2>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3">
      <Demo name="Modal" note="trigger → portalled dialog with the Modal* / Drawer* shared parts">
        <Modal>
          <ModalTrigger>
            <Button variant="solid" size="sm">Open modal</Button>
          </ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Delete project</ModalTitle>
              <ModalDescription>This cannot be undone.</ModalDescription>
            </ModalHeader>
            <ModalBody>
              <p class="text-sm">Every file, deployment and secret attached to the project is removed.</p>
            </ModalBody>
            <ModalFooter>
              <ModalClose>
                <Button variant="ghost" size="sm">Cancel</Button>
              </ModalClose>
              <Button variant="solid" tone="danger" size="sm">Delete</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Demo>

      <Demo name="AlertModal" note="role=alertdialog — Escape should NOT dismiss by default">
        <Button variant="outline" tone="danger" size="sm" @click="alertOpen = true"> Open alert modal </Button>
        <AlertModal v-model:open="alertOpen">
          <AlertModalContent>
            <ModalHeader>
              <ModalTitle>Discard changes?</ModalTitle>
              <ModalDescription>Unsaved edits are lost.</ModalDescription>
            </ModalHeader>
            <ModalFooter>
              <AlertModalCancel>
                <Button variant="ghost" size="sm">Keep editing</Button>
              </AlertModalCancel>
              <AlertModalAction>
                <Button variant="solid" tone="danger" size="sm">Discard</Button>
              </AlertModalAction>
            </ModalFooter>
          </AlertModalContent>
        </AlertModal>
      </Demo>

      <Demo name="Drawer" note="side axis: left / right / top / bottom">
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="s in ['left', 'right', 'top', 'bottom'] as const"
            :key="s"
            variant="outline"
            size="sm"
            @click="openDrawer(s)"
          >
            {{ s }}
          </Button>
        </div>
        <Drawer v-model:open="drawerOpen" :side="drawerSide">
          <DrawerContent size="md">
            <ModalHeader>
              <ModalTitle>Drawer — {{ drawerSide }}</ModalTitle>
            </ModalHeader>
            <ModalBody><p class="text-sm">Body content.</p></ModalBody>
          </DrawerContent>
        </Drawer>
      </Demo>

      <Demo name="Popover" note="placement + arrow — click the trigger">
        <div class="flex flex-wrap gap-2">
          <Popover v-for="p in ['top', 'right', 'bottom', 'left'] as const" :key="p" :placement="p">
            <PopoverTrigger>
              <Button variant="soft" size="sm">{{ p }}</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <div class="p-2 text-xs">Popover placed {{ p }}</div>
            </PopoverContent>
          </Popover>
        </div>
      </Demo>

      <Demo name="HoverCard" note="hover the trigger for ~700ms">
        <HoverCard :open-delay="150">
          <HoverCardTrigger>
            <span class="cursor-default text-sm underline decoration-dotted">@wow-two</span>
          </HoverCardTrigger>
          <HoverCardContent>
            <HoverCardArrow />
            <div class="w-48 p-2 text-xs">The wow-two ecosystem account.</div>
          </HoverCardContent>
        </HoverCard>
      </Demo>

      <Demo name="ActionSheet">
        <Button variant="outline" size="sm" @click="sheetOpen = true">Open action sheet</Button>
        <ActionSheet v-model:open="sheetOpen" title="Photo" description="Choose an action">
          <ActionSheetAction>Save to library</ActionSheetAction>
          <ActionSheetAction>Share</ActionSheetAction>
          <ActionSheetAction is-destructive>Delete</ActionSheetAction>
          <ActionSheetCancel>Cancel</ActionSheetCancel>
        </ActionSheet>
      </Demo>

      <Demo name="BottomSheet" note="snap points 40vh / 90vh, drag to dismiss">
        <Button variant="outline" size="sm" @click="bottomOpen = true">Open bottom sheet</Button>
        <BottomSheet v-model:open="bottomOpen">
          <ModalHeader><ModalTitle>Bottom sheet</ModalTitle></ModalHeader>
          <ModalBody><p class="text-sm">Drag the handle to snap or dismiss.</p></ModalBody>
        </BottomSheet>
      </Demo>

      <Demo name="BackdropOverlay" note="inline — blurred variant over the box">
        <div class="relative h-24 overflow-hidden rounded-md bg-muted">
          <div class="p-2 text-xs">content behind the backdrop</div>
          <BackdropOverlay :is-open="backdropOn" is-blurred is-inline />
        </div>
        <Button variant="ghost" size="sm" class="mt-2" @click="backdropOn = !backdropOn">
          toggle backdrop ({{ backdropOn }})
        </Button>
      </Demo>

      <!-- The 6 shared chrome SFCs (`OverlayHeader/Title/Description/Body/Footer/CloseButton`)
           are NOT exported under those names — each overlay re-exports them under its own
           prefix, so `ModalTitle`, `DialogTitle`, `DrawerTitle` and `BottomSheetTitle` are
           all the same component. They inject the overlay-chrome context and throw outside
           a Modal / Drawer, so they are only shown in-place above. -->
      <Demo name="Modal* / Dialog* / Drawer* aliases" note="one SFC per part, four export names">
        <table class="w-full text-left text-[11px]">
          <thead>
            <tr class="text-subtle-foreground">
              <th class="py-1">shared SFC</th>
              <th>Modal</th>
              <th>Dialog</th>
              <th>Drawer</th>
            </tr>
          </thead>
          <tbody class="font-mono">
            <tr v-for="p in ['Header', 'Title', 'Description', 'Body', 'Footer']" :key="p">
              <td class="py-0.5">AnchorLayout{{ p }}</td>
              <td>Modal{{ p }}</td>
              <td>Dialog{{ p }}</td>
              <td>Drawer{{ p }}</td>
            </tr>
            <tr>
              <td class="py-0.5">OverlayCloseButton</td>
              <td>ModalClose</td>
              <td>DialogClose</td>
              <td>DrawerClose</td>
            </tr>
          </tbody>
        </table>
      </Demo>
    </div>

    <h3 class="border-t border-border pt-4 font-mono text-xs uppercase text-subtle-foreground">auto-mounted tail</h3>
    <AutoGroup :namespace="overlays" :covered="covered" />
  </div>
</template>
