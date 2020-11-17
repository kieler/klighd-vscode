/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { NotificationContentRenderer } from '@theia/messages/lib/browser/notification-content-renderer';
import { injectable } from 'inversify';

/**
 * A renderer for notifications, overwriting the behavior to display multiline notifications with
 * their newline chars.
 */
@injectable()
export class MultilineNotificationContentRenderer extends NotificationContentRenderer {

    renderMessage(content: string): string {
        // Just use the notification renderer's markdown engine for rendering the message.
        // Note, that newlines are not replaced, but simply forwarded to the markdown engine.
        return this.mdEngine.renderInline(content);
    }
}