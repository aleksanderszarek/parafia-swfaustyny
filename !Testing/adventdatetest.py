from pyautogui import press as clk
from pyautogui import write as wrt
from time import sleep as slp
#! =================> Config
months = [11, 12] #? Months for test
starton = [20, 1] #? Start dates of tests for months
endwith = [30, 31] #? End dates of tests for months
interval = 0 #? Time between tests
startwaittime = 3 #? Delay before the first test starts
repeat = 30 #? Number of tests for each date (at least 1)
dayvariable = "day" #? Name of variable that stores current day
monthvariable = "month" #? Name of variable that stores current month 
refreshfunction = "test" #? Name of refresh function that relaunches whole JavaScript code

slp(startwaittime)
for i in range(repeat):
    monthindex = -1
    for month in months:
        monthindex+=1
        dayindex = 0
        wrt(f"{monthvariable} = {months[monthindex]}")
        clk("enter")
        for day in range(endwith[monthindex]):
            dayindex += 1
            if starton[monthindex] <= dayindex:
                wrt(f"{dayvariable} = {dayindex}")
                clk("enter")
                wrt(f"{refreshfunction}()")
                clk("enter")
                slp(interval)
    clk("F5")