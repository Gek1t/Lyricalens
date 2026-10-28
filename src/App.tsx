/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ViewPager } from './components/ViewPager';
import { initCloudSyncListener } from './db/cloudSync';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';

export default function App() {
  // Global Android hardware/gesture back button & hierarchy navigation
  useAndroidBackButton();

  useEffect(() => {
    initCloudSyncListener();
  }, []);

  return <ViewPager />;
}

