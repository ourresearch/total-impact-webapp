#!/bin/sh

for i in $(seq 0 2); do 
osascript <<END 
tell application "Terminal"
tell application "System Events" to keystroke "t" using {command down}
    do script "export REDIS_URL=redis://127.0.0.1:6379; tabname rq_worker_$i; cd ../total-impact-webapp; python rq_worker.py" in front window
end tell
END
done

