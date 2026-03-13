
DownNotice is a cross platform Desktop Appication, that lives in the taskbar, that monitors RSS feeds for various cloud providors and offers realtime data on Cloud Outages.
There should be toast notifications when an update is pushed for each outage.
Click on the icon should provide a A small popup window near the tray (more like a popover) with current notices
Opening the desktop interface Should provide a time based list of what is currently down.
You can click into each application to see just that application's notices
Clicking on the setting button should provide 
1. an interface to add new rss, with options to select a name, icon and any updates
2. setting for refresh rate, light mode, dark mode, system color, etc.
3. about

Example RSS:
https://azure.status.microsoft/en-us/status/feed/
https://status.aws.amazon.com/rss/all.rss
https://status.cloud.google.com/en/feed.atom
https://www.githubstatus.com/history.rss
https://www.cloudflarestatus.com/history.atom

Technology:
Please develop this in Electron with React targeting Windows, MacOS, and Linux.

Design:
The Tray Icon should change color Green / Yellow / Red
Green - All Good
Yellow - Degraded
Red - Down
Black - Failed to fetch / parse feed
Use OS Native notifications
By Default provide the example rss feeds in the setting file.
Please store the setting in a JSON file in the client's Home Directory
Windows - %appdata%/DownNotice/settings.json
Linux - ~/.DownNotice/settings.json
MacOS - ~/Library/Application Support/DownNotice/settings.json


Functional:
The Polling default should be 15 min, but should be changeable in the settings.
History should go back 48 hours
parce all feeds provided
The app should auto-start on pc startup

Icon:
Please provide cloud provider icons and a generic set for unknown providers

About:
Please provide the name of the application
version number
build date
a scroling text box with a GPL 2
