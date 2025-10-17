import * as React from 'react';
import { PlasmicCanvasHost, registerComponent } from '@plasmicapp/host';
import HomeLayout from '../components/HomeLayout';
import TestBox from '../components/TestBox';

// Track if we've already registered to prevent duplicates
let registered = false;

// Register your code components here
if (!registered) {
  // Simple test component
  registerComponent(TestBox, {
    name: 'TestBox',
    importPath: '../components/TestBox',
    props: {
      text: {
        type: 'string',
        defaultValue: 'Hello from TestBox!',
      },
    },
  });

  // Full layout component
  registerComponent(HomeLayout, {
    name: 'HomeLayout',
    importPath: '../components/HomeLayout',
    props: {
      left: {
        type: 'slot',
        defaultValue: 'Left content here',
      },
      right: {
        type: 'slot',
        defaultValue: 'Right content here',
      },
    },
  });
  registered = true;
}

export default function PlasmicHost() {
  return <PlasmicCanvasHost />;
}
