import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePlaylistInput } from './clientMusicSync';

test('parsePlaylistInput detects NetEase, QQ, KuGou, KuWo, and Migu URLs and extracts playlist IDs', () => {
  const ncm = parsePlaylistInput('https://music.163.com/#/playlist?id=829104819', 'netease');
  assert.ok(ncm);
  assert.equal(ncm.platform, 'netease');
  assert.equal(ncm.playlistId, '829104819');

  const qq = parsePlaylistInput('https://y.qq.com/n/ryqq/playlist/7022067757', 'qq');
  assert.ok(qq);
  assert.equal(qq.platform, 'qq');
  assert.equal(qq.playlistId, '7022067757');

  const kugou = parsePlaylistInput('https://www.kugou.com/yy/special/single/547214.html', 'kugou');
  assert.ok(kugou);
  assert.equal(kugou.platform, 'kugou');
  assert.equal(kugou.playlistId, '547214');

  const kuwo = parsePlaylistInput('https://www.kuwo.cn/playlist_detail/1082685104', 'kuwo');
  assert.ok(kuwo);
  assert.equal(kuwo.platform, 'kuwo');
  assert.equal(kuwo.playlistId, '1082685104');

  const migu = parsePlaylistInput('https://music.migu.cn/v3/music/playlist/1928374', 'migu');
  assert.ok(migu);
  assert.equal(migu.platform, 'migu');
  assert.equal(migu.playlistId, '1928374');
});
