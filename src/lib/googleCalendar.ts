/**
 * Google Calendar Integration - Frontend Only
 * Directly calls Google Calendar REST API from browser
 */

export interface CalendarEvent {
    title: string;
    description: string;
    startDate: Date;
    durationHours: number;
}

export interface NodeEstimate {
    nodeId: string;
    nodeTitle: string;
    estimatedHours: number;
    description: string;
}

/**
 * Generate learning schedule from nodes
 */
export function generateLearningSchedule(
    nodes: NodeEstimate[],
    startDate: Date,
    dailyHours: number = 2
): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    let currentDate = new Date(startDate);

    for (const node of nodes) {
        const hoursRemaining = node.estimatedHours;
        let hoursScheduled = 0;

        while (hoursScheduled < hoursRemaining) {
            const sessionHours = Math.min(dailyHours, hoursRemaining - hoursScheduled);

            events.push({
                title: node.nodeTitle,
                description: node.description,
                startDate: new Date(currentDate),
                durationHours: sessionHours
            });

            hoursScheduled += sessionHours;

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return events;
}

/**
 * Create events in Google Calendar using REST API
 * Called directly from frontend with Google access token
 */
export async function createCalendarEvents(
    googleAccessToken: string,
    events: CalendarEvent[]
): Promise<{ success: boolean; eventIds: string[]; failedCount: number }> {
    console.log(`📅 Creating ${events.length} calendar events...`);

    const eventIds: string[] = [];
    let failedCount = 0;

    for (const event of events) {
        const endDate = new Date(event.startDate);
        endDate.setHours(endDate.getHours() + event.durationHours);

        try {
            // Call Google Calendar REST API directly from browser
            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    summary: `📚 ${event.title}`,
                    description: event.description,
                    start: {
                        dateTime: event.startDate.toISOString(),
                        timeZone: 'Asia/Jakarta'
                    },
                    end: {
                        dateTime: endDate.toISOString(),
                        timeZone: 'Asia/Jakarta'
                    },
                    colorId: '9', // Blue color for learning
                    reminders: {
                        useDefault: false,
                        overrides: [
                            { method: 'popup', minutes: 30 }
                        ]
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`❌ Failed to create event "${event.title}":`, errorData);

                // Handle specific Google API errors
                if (response.status === 401) {
                    throw new Error('Google session expired. Please sign in again.');
                } else if (response.status === 403) {
                    throw new Error('Calendar access denied. Please grant Calendar permissions.');
                }

                failedCount++;
                continue;
            }

            const data = await response.json();
            if (data.id) {
                eventIds.push(data.id);
                console.log(`✓ Event created: ${event.title}`);
            }
        } catch (error: any) {
            console.error(`❌ Failed to create event "${event.title}":`, error.message);

            // If it's an auth error, throw immediately
            if (error.message.includes('session expired') || error.message.includes('access denied')) {
                throw error;
            }

            failedCount++;
        }
    }

    console.log(`✓ Successfully created ${eventIds.length}/${events.length} events`);

    if (failedCount > 0 && eventIds.length === 0) {
        throw new Error('Failed to create any calendar events. Please try again.');
    }

    return { success: true, eventIds, failedCount };
}
