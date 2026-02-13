import { LiveCoCounselChat } from '@/components/LiveCoCounselChat';
import { Avatar, type AvatarHandle } from '@/components/Avatar';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useRef } from 'react';

export default function LiveCoCounselChatPage() {
  const avatarRef = useRef<AvatarHandle>(null);

  return (
    <div className="live-chat-page">
      <div className="live-chat-page__overlay" />
      <PanelGroup direction="horizontal">
        <Panel>
          <Avatar ref={avatarRef} />
        </Panel>
        <PanelResizeHandle className="live-chat-resizer" />
        <Panel>
          <div className="live-chat-pane">
            <LiveCoCounselChat speak={(text) => void avatarRef.current?.speak(text)} />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
