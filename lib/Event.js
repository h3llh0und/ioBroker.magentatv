class Event {
    static startTime = '';
    static duration = '';
    static language = '';
    static eventName = '';
    static description = '';
    static updateFunction;
    static createFunction;

    static UpdateFromJson(jsonEvent) {
        if(jsonEvent !== null) {
            Event.startTime = jsonEvent.start_time;
            Event.duration = jsonEvent.duration;
            Event.language = jsonEvent.short_event[0].language_code;
            Event.eventName = jsonEvent.short_event[0].event_name;
            Event.description = jsonEvent.short_event[0].text_char;
        }
    }

    static async SaveToState(parent) {
        await Event.updateFunction(parent + '.StartTime', Event.startTime, true);
        await Event.updateFunction(parent + '.Duration', Event.duration, true);
        await Event.updateFunction(parent + '.Language', Event.language, true);
        await Event.updateFunction(parent + '.EventName', Event.eventName, true);
        await Event.updateFunction(parent + '.Description', Event.description, true);
    }

    static async CreateState(parent) {
        await Event.CreateStateIntern(parent, 'StartTime');
        await Event.CreateStateIntern(parent, 'Duration');
        await Event.CreateStateIntern(parent, 'Language');
        await Event.CreateStateIntern(parent, 'EventName');
        await Event.CreateStateIntern(parent, 'Description');
    }

    static async CreateStateIntern(parent, name) {
        await Event.createFunction(parent + '.' + name, {
            type: 'state',
            common: {
                name: parent + name,
                type: 'string',
                role: parent + ' ' + name,
                read: true,
                write: false
            },
            native: {},
        });
    }
}

module.exports = Event;



module.exports = Event;
