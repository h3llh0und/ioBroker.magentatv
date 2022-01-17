![Logo](admin/magentatv.png)
# ioBroker.magentatv

[![NPM version](https://img.shields.io/npm/v/iobroker.magentatv.svg)](https://www.npmjs.com/package/iobroker.magentatv)
[![Downloads](https://img.shields.io/npm/dm/iobroker.magentatv.svg)](https://www.npmjs.com/package/iobroker.magentatv)
![Number of Installations](https://iobroker.live/badges/magentatv-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/magentatv-stable.svg)
[![Dependency Status](https://img.shields.io/david/h3llh0und/iobroker.magentatv.svg)](https://david-dm.org/h3llh0und/iobroker.magentatv)

[![NPM](https://nodei.co/npm/iobroker.magentatv.png?downloads=true)](https://nodei.co/npm/iobroker.magentatv/)

**Tests:** ![Test and Release](https://github.com/h3llh0und/ioBroker.magentatv/workflows/Test%20and%20Release/badge.svg)

## magentatv adapter for ioBroker

Control your MagentaTv receiver

## Usage

![image](https://user-images.githubusercontent.com/6917818/149179561-b3116216-b7cb-40bc-905f-53978fb24bf7.png)
MagentaTv Receiver Adress is needed and the Telekom UserId(see below). Rest is filled in automatic.

![image](https://user-images.githubusercontent.com/6917818/149181874-901754b3-4ffe-4fc6-945a-d96230cf809e.png)
Current and Next Event gives Information about the current and next Program.

Channel is the current channel.

Playmode should show in what mode the receiver is. Stop means off und the rest is on. This state is not really updated by receiver.(Try to work on that :D)

Under Keys there are all(hope i didnt forget any) Keys from the Remote Control.

You can do the same with this Adapter as with the remote Control.


## How to obtain Telekom UserID

Press F12 to open Developer Tools. Open https://web.magentatv.de/tv-guide 14 and Login to your Telekom Account.

Open Network Tab and Filter for DTA.

Click the second one with type fetch.

Open Preview and you should see the userid.

Then use: https://cryptii.com/pipes/md5-hash to calculate the md5 hash and hex value of it.

Left fill in userID and on right side you see your ID needed. After that you just need to do an Uppercase.

![image](https://user-images.githubusercontent.com/6917818/149174962-9374015a-c17b-4f9d-a5ed-7e4cec683232.png)

## Todos

Automatic getting UserID

Autodetecting Receivers

Code Optimization

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### **WORK IN PROGRESS**
* (h3llh0und) initial release

## License
MIT License

Copyright (c) 2022 h3llh0und <h3llh0und0815@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
