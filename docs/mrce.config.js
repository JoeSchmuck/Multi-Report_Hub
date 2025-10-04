// handle the costants here
window.MRCE = window.MRCE || {};

// fields gen
window.MRCE.CONFIG = {
		"Email Settings": {
            __target: "#mr-tab1-acc1 .accordion-body",    
            "General Email Settings 2": {
                "label": "Email Address Settings",
                "options": {
                    "Email": { "label": "Email **", "type": "email", "default": "", "required": true },
                    "From": { "label": "From", "type": "email", "default": "" },
					"FromName": { "label": "From Name", "type": "text", "default": "" }
               }
            },
            "General Email Settings 3": {
                "label": "Alert Email Configuration (-m switch)",
                "options": {
					"AlertEmail": { "label": "Address to send Alerts listed below, typically used to send alarm condition emails such as drive temp alarms.", "type": "email", "default": "" },
                    "AlertOnWarningTemp": { "label": "Drive Temperature Warning", "type": "checkbox", "default": "enable" },
                    "AlertOnWarningError": { "label": "Drive Warning Error", "type": "checkbox", "default": "enable" },					
                    "AlertOnCriticalError": { "label": "Drive Critical Error", "type": "checkbox", "default": "enable" }
               }
            },
            "General Email Settings 4": {
                "label": "Email On Alarm ONLY",
                "options": {
                    "Email_On_Alarm_Only": { "label": "Send an email ONLY if there is a alarm condition?", "type": "checkbox", "default": "disable" },					
                    "Email_On_Alarm_Only_And_Attachments": { "label": "Send alarms and attachments?", "type": "checkbox", "default": "enable" }
               }
            },
        },
		"Drive-Selftest - S.M.A.R.T. Testing": {
            __target: "#mr-tab2-acc1 .accordion-body",   
			"Drive-Selftest": {
			"label": "General Configuration",
			"options": {
				"External_SMART_Testing": { "label": "Do you want to run SMART Testing?", "type": "checkbox", "default": "enable"},
				"External_Script_Name": { "label": "Path to drive_selftest.sh", "type": "text", "default": "$SCRIPT_DIR/drive_selftest.sh", "required": true},
				"Use_multi_report_config_values": { "label": "Use the multi_report_config.txt file for Drive-Selftest?", "type": "checkbox", "default": "enable"},
				"Test_ONLY_NVMe_Drives": { "label": "ONLY test NVMe drives", "type": "checkbox", "default": "disable"},
				"Track_Drive_Testing_Dates": { "label": "Enable Drive Testing Tracking", "type": "checkbox", "default": "enable"},
				"selftest_data_file": { "label": "Path and file name for tracking the selftest drive dates.", "type": "text", "default": "$SCRIPT_DIR/drive_selftest_tracking.csv", "required": true},
				"Enable_Logging": { "label": "Create a Drive Selftest Report", "type": "checkbox", "default": "enable"},
				"LOG_DIR": { "label": "Drive Selftest (DS) Logs directory.", "type": "text", "default": "$SCRIPT_DIR/DS_Logs" },
				"Silent": { "label": "Only error messages will be output to the stdout. (Silent Mode)", "type": "checkbox", "default": "enable"},			
				"Override_SMART_Disabled": { "label": "Do you want to enable S.M.A.R.T. capabilities if the drive has it disabled, AND able to support it?", "type": "checkbox", "default": "disable"}
				}
			},

			"SCRUB and RESILVER (with respect to this testing)": {
			"label": "SCRUB and RESILVER (with respect to this testing)",
			"options": {
				"SCRUB_Minutes_Remaining": { "label": "Set the remaining minutes threshold to allow a SCRUB to start?", "type": "number", "required": true, "min":0, "default": 60},
				"SCRUB_RESILVER_OVERRIDE": { "label": "Override SCRUB and RESILVER restrictions?", "type": "checkbox", "default": "disable"},
				"Maximum_Catchup_Drive_Count": { "label": "Maximum Drive Catchup", "type": "number", "required": true, "min":0, "max":100, "default": 1}
				}
			},
			
			"Short Tests1":{
			"label": "Short Tests Group 1",
			"options": {
				"Short_Test_Mode": { "label": "Select the Test Mode", "type": "select", "required": true, "default": "2", "options": [ { "value": "1", "label": "Use Test Mode 1 settings to determine the drives to be tested" }, { "value": "2", "label": "All drives are tested" }, { "value": "3", "label": "No drives tested" }]},
				"Short_Time_Delay_Between_Drives": { "label": "Delay between SMART test starting for Short tests.", "type": "number", "required": true, "min":0, "default": 1 },
				"Short_Drives_Test_Delay": { "label": "Delay after starting the last Short test before continuing.", "type": "number", "required": true, "min":0, "default": 130 }
				}
			},
			
			"Short Tests2":{
			"label": "Short Tests Group (Test Mode 1 only)",
			"options": {
				"Short_SMART_Testing_Order": { "label": "Testing Sort Order", "type": "select", "required": true, "default": "DriveID", "options": [ { "value": "DriveID", "label": "Use the Drive ID (sda, sdb, sdc...) to sort the drives for testing" }, { "value": "Serial", "label": "Use the Drive Serial Number to sort the drives for testing" }]},
				"Short_Drives_to_Test_Per_Day": { "label": "Minimum number of drives tested.", "type": "number", "required": true, "min":0, "max":100, "default": 1 },
				"Short_Drives_Test_Period": { "label": "Test all drives in a week or month.", "type": "select", "required": true, "default": "Week", "options": [ "Week", "Month"]},
				"Short_Drives_Tested_Days_of_the_Week": { "label": "Days of the week testing is allowed.", "type": "dayscheckbox", "default": "1,2,3,4,5,6,7"}
				}
			},
		
			"Long Tests1": {
			"label": "Long Tests Group 1",
			"options": {
				"Long_Test_Mode": { "label": "Select the Test Mode", "type": "select", "required": true, "default": "1", "options": [ { "value": "1", "label": "Use Test Mode 1 settings to determine the drives to be tested" }, { "value": "2", "label": "All drives tested" }, { "value": "3", "label": "No drives tested" }]},
				"Long_Time_Delay_Between_Drives": { "label": "Delay between SMART test starting for Long tests.", "type": "number", "required": true, "min":0, "default": 1 }
				}
			},
			
			"Long Tests2":{
			"label": "Long Tests Group (Test Mode 1 only)",
			"options": {
				"Long_SMART_Testing_Order": { "label": "Testing Sort Order", "type": "select", "required": true, "default": "Serial", "options": [ { "value": "DriveID", "label": "Use the Drive ID (sda, sdb, sdc...) to sort the drives for testing" }, { "value": "Serial", "label": "Use the Drive Serial Number to sort the drives for testing" }]},
				"Long_Drives_to_Test_Per_Day": { "label": "Minimum number of drives tested.", "type": "number", "required": true, "min":0, "max":100, "default": 1 },
				"Long_Drives_Test_Period": { "label": "Test all drives in a week or month.", "type": "select", "required": true, "default": "Week", "options": [ "Week", "Month"]},
				"Long_Drives_Tested_Days_of_the_Week": { "label": "Days of the week testing is allowed.", "type": "dayscheckbox", "default": "1,2,3,4,5,6,7"}
				}
			},
			"SMARTCTL Interface Options":{
			"label": "SMARTCTL Interface Options",
			"options": {
				"SMARTCTL_Interface_Options": { "label": "Use to add other interface types.", "type": "text", "default": "auto,sat,atacam,scsi,nvme"}
				}
			},
		},
		"Email Attachments":{
            __target: "#mr-tab1-acc2 .accordion-body",
            "AttachMRConfig": {
                "label": "Attach multi_report_config.txt to Email",
                "options": {
                    "MRConfigEmailEnable": { "label": "Attach Multi-Report Config file to the Email:", "type": "checkbox", "default": "enable" },
                    "MRConfigEmailDay": { "label": "What day do you want the Multi-Report configuration file attached?:", "type": "select", "required": true, "default": "Mon", "options": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Month", "Never"] },
					"MRChangedEmailSend": { "label": "Do you want thr Original and NEW Config files sent as an attachment if the file is updated?:", "type": "checkbox", "default": "enable" }
                }
            },
			"TrueNAS config backup settings": {
				"label": "Attach TrueNAS Configuration files to Email",
				"options": {
					"TrueNASConfigEmailEnable": { "label": "Attach TrueNAS Config file to the Email:", "type": "checkbox", "default": "enable" },
					"TrueNASConfigEmailDay": { "label": "What day do you want the TrueNAS configuration file attached?:", "type": "select", "required": true, "default": "Mon", "options": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Month"] }
				}
			},
			"SDF file attachment": {
				"label": "Statistical Data File",
				"options": {
			        "SDF_DataEmail": { "label": "Enable SDF Data Email:", "type": "checkbox", "default": "enable" },
                    "SDF_DataEmailDay": { "label": "SDF Data Email Day:", "type": "select", "required": true, "default": "Mon", "options": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Month"] }
				}
			},
		},
		"Script Updates": {
			__target: "#mr-tab4-acc1 .accordion-body",  
			"UpdatesCheck": {
				"label": "Updates",
				"options": {
					"Check_For_Updates": { "label": "Check GitHub for updates.", "type": "checkbox", "default": "enable" },
					"Automatic_MR_Update": { "label": "Automatically Apply Multi-Report Updates.", "type": "checkbox", "default": "disable" },
					"Automatic_Selftest_Update": { "label": "Automatically Apply Drive-Selftest Updates.", "type": "checkbox", "default": "disable" },
					"Automatic_Sendemail_Update": { "label": "Automatically Apply Sendemail Updates.", "type": "checkbox", "default": "disable" }
				}
			}
		},
        "Statistical Data File": {
			__target: "#mr-tab3-acc1 .accordion-body",  
            "SDF_Report": {
                "label": "Statistical Data File (SDF)",
                "options": {
                    "statistical_data_file": { "label": "Statistical Data File:", "type": "text", "default": "$SCRIPT_DIR/statisticalsmartdata.csv", "required": true },
                    "SDF_DataRecordEnable": { "label": "Enable SDF Data Record:", "type": "checkbox", "default": "enable" },
                    "SDF_DataPurgeDays": { "label": "SDF Data Purge Days:", "type": "number", "required": true, "min":0, "default": 720},
				"add_new_drive_factor": { "label": "Add New Drive Factor", "type": "select", "required": true, "default": "actual", "options": [ { "value": "actual", "label": "When adding a new drive, use the drive Power On Hours for metrics" }, { "value": "Serial", "label": "When adding a new drive, do not use the drive Power On Hours for metrics, start at a zero value." }]}
                }
            },
			
        },
	    "Report Configuration": {
			__target: "#mr-tab3-acc2 .accordion-body",  
            "Report Configuration": {
                "label": "Report Configuration",
                "options": {
					"Enable_Text_Section": { "label": "Enable the Text Section below the CHART", "type": "checkbox", "default": "enable"},
					"font": { "label": "Font Type for Text Section", "type": "text", "default": "courier new" },
					"font_size": { "label": "Font Size for Text Section", "type": "number", "required": true, "min":0, "max":32, "default": 16 },
					"Total_Data_Written_Month": { "label": "Total Data Written", "type": "select", "required": true, "default": "30Days", "options": [ { "value": "30Days", "label": "Use a rolling 30 day average for TDW/TDR metrics" }, { "value": "month", "label": "Use the current calendar month for TDW/TDR metrics" }]},
					"Enable_Messages": { "label": "Enable Warning/Caution Text Messages", "type": "checkbox", "default": "enable" },
					"Enable_Zpool_Messages": { "label": "Enable Zpool Status and GPTID section", "type": "checkbox", "default": "enable" },
                    "Enable_SMART_Messages": { "label": "Enable SMART data in report", "type": "checkbox", "default": "enable" },
					"ReportNonSMART": { "label": "Force non-SMART devices to be reported", "type": "checkbox", "default": "enable" },
					"DisableRAWdata": { "label": "Remove the >smartctl -a data< and non-smart data from the normal report.", "type": "checkbox", "default": "disable" },
					"ATA_Auto_Enable": { "label": "Update Log Error count offset automatically for new errors.", "type": "checkbox", "default": "disable" },
					"zfs_report_enable": { "label": "Enable ZFS Report:", "type": "checkbox", "default": "enable" },
                    "zfs_report_only_on_error": { "label": "Send ZFS Report on Error Only:", "type": "checkbox", "default": "disable" },
					"smart_report_enable": { "label": "Enable SMART Report:", "type": "checkbox", "default": "enable" },
                    "send_smart_report_only_on_error": { "label": "Send SMART Report on Error Only:", "type": "checkbox", "default": "disable" },
					"scrub_report_enable": { "label": "Enable Scrub Report:", "type": "checkbox", "default": "disable" },
                    "scrub_report_only_on_error": { "label": "Send Scrub Report on Error Only:", "type": "checkbox", "default": "disable" }
                }
            }
        },
        "Report Chart Configuration - Headers": {
			__target: "#mr-tab3-acc3 .accordion-body",  
            "ReportChartConfig": {
                "label": "Report Chart Configuration",
                "options": {
					"chartfont": { "label": "Font Type for Chart Section", "type": "text", "default": "times new roman" },
					"chart_font_size": { "label": "Font Size for Chart Section", "type": "number", "required": true, "min":0, "max":30, "default": 15 },
                    "Subject_Line_Normal": { "label": "Email Subject Line - Normal:", "type": "text", "default": "SMART Testing Results for ${host} - All is Good" },
					"Subject_Line_Warning": { "label": "Email Subject Line - Warning:", "type": "text", "default": "*WARNING*  SMART Testing Results for ${host}  *WARNING*" },
					"Subject_Line_Critical": { "label": "Email Subject Line - Critical:", "type": "text", "default": "*CRITICAL ERROR*  SMART Testing Results for ${host}  *CRITICAL ERROR*" },
					"HDDreportTitle": { "label": "Title of the HDD Chart Section", "type": "text", "default": "Spinning Rust Summary Report" },
					"SSDreportTitle": { "label": "Title of the SSD Chart Section", "type": "text", "default": "SSD Summary Report" },
					"NVMreportTitle": { "label": "Title of the NVMe Chart Section", "type": "text", "default": "NVMe Summary Report" }
                }
            }
        },	
		"Alarm Settings": {
            __target: "#mr-tab1-acc3 .accordion-body",
			"Alarm Thresholds - Temperature": {
				"label": "Alarm Thresholds - Temperature",
				"options": {
					"PoolUsedWarn": { "label": "Pool percentage Warning", "type": "number", "required": true, "min":0, "max":100, "default": 80 },
					"ScrubAgeWarn": { "label": "Pool SCRUB Age (days) Warning", "type": "number", "required": true, "min":0, "default": 37 },
					"ZpoolFragWarn": { "label": "Pool fragmentation Warning", "type": "number", "required": true, "min":0, "max":100, "default": 80 },
					"HDDtempWarn": { "label": "HDD Warning Temperature", "type": "number", "required": true, "min":0, "max":100, "default": 45 },
					"HDDtempCrit": { "label": "HDD Critical Temperature", "type": "number", "required": true, "min":0, "max":100, "default": 50 },
					"HDD_Cur_Pwr_Max_Temp_Ovrd": { "label": "HDD Maximum Temperature Override - Current Cycle", "type": "checkbox", "default": "disable" },
					"SSDtempWarn": { "label": "SSD Warning Temperature", "type": "number", "required": true, "min":0, "max":100, "default": 50 },
					"SSDtempCrit": { "label": "SSD Critical Temperature", "type": "number", "required": true, "min":0, "max":100, "default": 60 },
					"SSD_Cur_Pwr_Max_Temp_Ovrd": { "label": "SSD Maximum Temperature Override - Current Cycle", "type": "checkbox", "default": "disable" },
					"NVMtempWarn": { "label": "NVMe Warning Temperature", "type": "number", "required": true, "min":0, "max":100, "default": 55 },
					"NVMtempCrit": { "label": "NVMe Critical Temperature", "type": "number", "required": true, "min":0, "max":100, "default": 65 },
					"NVM_Cur_Pwr_Max_Temp_Ovrd": { "label": "NVMe Maximum Temperature Override - Current Cycle", "type": "checkbox", "default": "disable" }
				}
			},
	
			"Alarm Thresholds - Media": {
				"label": "Alarm Thresholds - Media",
				"options": {
					"SectorsWarn": { "label": "How many sector errors before Warning message", "type": "number", "required": true, "min":0, "default": 0 },
					"SectorsCrit": { "label": "How many sector errors before Critical message", "type": "number", "required": true, "min":0, "default": 9 },
					"ReAllocWarn": { "label": "How many Reallocated sectors before WARNING message", "type": "number", "required": true, "min":0, "default": 0 },
					"MultiZoneWarn": { "label": "How many MultiZone errors before WARNING message", "type": "number", "required": true, "min":0, "default": 0 },
					"MultiZoneCrit": { "label": "How many MultiZone errors before Critical message", "type": "number", "required": true, "min":0, "default": 5 },
					"DeviceRedFlag": { "label": "Device Column will indicate RED for ANY alarm condition by drive row", "type": "checkbox", "default": "enable" },
					"HeliumAlarm": { "label": "Enable the Helium Alarm", "type": "checkbox", "default": "enable" },
					"HeliumMin": { "label": "Percent Low Helium Level before alarm", "type": "number", "required": true, "min":0, "default": 100 },
					"RawReadWarn": { "label": "Read errors allowable before WARNING message", "type": "number", "required": true, "min":0, "default": 5 },
					"RawReadCrit": { "label": "Read errors allowable before Critical message", "type": "number", "required": true, "min":0, "default": 100 },
					"SeekErrorsWarn": { "label": "Seek errors allowable before WARNING message", "type": "number", "required": true, "min":0, "default": 5 },
					"SeekErrorsCrit": { "label": "Seek errors allowable before Critical message", "type": "number", "required": true, "min":0, "default": 100 },
					"NVM_Media_Errors": { "label": "NVMe Media Errors allowable before alarm", "type": "number", "required": true, "min":0, "max":100, "default": 1 },
					"WearLevelCrit": { "label": "Wear Level setpoint for a CRITICAL message", "type": "number", "required": true, "min":0, "max":100, "default": 9 },
					"TestWarnAge": { "label": "Test Age Days allowedable before WARNING message", "type": "number", "required": true, "min":0, "default": 2 },
					"NVMe_Ignore_Invalid_Errors": { "label": "NVMe Ignore Invalid Field in Command messages", "type": "checkbox", "default": "disable" }
				}
			},

			"Ignore or Activate Alarms": {
				"label": "Ignore or Activate Alarms",
				"options": {
				"IgnoreUDMA": { "label": "Ignore UltraDMA CRC Errors for the summary alarm (Email Header) only", "type": "checkbox", "default": "disable" },
				"IgnoreSeekError": { "label": "Ignore Seek Error Rate/Health errors.", "type": "checkbox", "default": "disable" },
				"IgnoreReadError": { "label": "Ignore Read Error Rate/Health errors.", "type": "checkbox", "default": "disable" },
				"IgnoreMultiZone": { "label": "Ignore MultiZone errors.", "type": "checkbox", "default": "disable" },
				"DisableWarranty": { "label": "Disable Email Subject line alerts for any expired warranty.", "type": "checkbox", "default": "enable" }
				}
			},
		},	
		"Add-On Features": {
            __target: "#mr-tab2-acc4 .accordion-body",   
			"Spencer Integration": {
				"label": "Spencer Integration",
				"options": {
					"spencer_enable": { "label": "Spencer Enable", "type": "checkbox", "default": "enable" },
					"spencer_script_name": { "label": "Path and file name to Spencer script", "type": "text", "default": "$SCRIPT_DIR/spencer.py", "required": true},
					"spencer_existing_warning_level": { "label": "Existing Warning Level", "type": "select", "required": true, "default": "None", "options": [ { "value": "None", "label": "Do not display a Warning for already KNOWN errors" }, { "value": "Warning", "label": "Display Warning and Critical messages for KNOWN errors" },{ "value": "Critical", "label": "Display Critical messages for KNOWN errors" }]},
					"spencer_new_warning_level": { "label": "New Warning Level", "type": "select", "required": true, "default": "Warning", "options": [ { "value": "None", "label": "Do not display a Warning for any NEW errors" }, { "value": "Warning", "label": "Display Warning and Critical messages when a NEW error occurs" },{ "value": "Critical", "label": "Display Critical messages when a NEW error occurs" }]},	
					}
			},

			"SMR Checks": {
				"label": "SMR Checks",
				"options": {
					"SMR_Enable": { "label": "SMR Check Enable", "type": "checkbox", "default": "enable" },
					"SMR_Update": { "label": "SMR Download", "type": "checkbox", "default": "enable"},
					"SMR_Ignore_Alarm": { "label": "Do not generate an SMR Alarm", "type": "checkbox", "default": "disable" },
					"SMR_New_Drive_Det_Count": { "label": "Number of times to generate an alarm before ignoring it", "type": "number", "required": true, "min":0, "max":100, "default": 14 }
				}
			},
					
			"Partition Check and Backup": {
				"label": "Partition Check and Backup",
				"options": {
					"Partition_Check": { "label": "Partition Check", "type": "checkbox", "default": "disable" },
					"Partition_Backup": { "label": "Partition Backup", "type": "checkbox", "default": "disable" }
				}
			}
		},		
		"Other Drive Settings": {
            __target: "#mr-tab2-acc3 .accordion-body",   
			"Other Drive Settings": {
				"label": "Other Settings",
				"options": {
					"Ignore_Lock": { "label": "Do Not check for multiple instances of Multi-Report", "type": "checkbox", "default": "disable" },
					"NVM_Low_Power": { "label": "Set NVMe drives to lowest power level", "type": "checkbox", "default": "enable" },
					"Multipath": { "label": "Multipath Setting", "type": "select", "required": true, "default": "off", "options": [ "off", "normal", "Exos2x", "serial"] },
					"Run_SMART_No_power_on_time": { "label": "Set Alternate methode for Power_On_Hours for SCSI drives?", "type": "checkbox", "default": "no" },
					"TrueNASConfigBackupSave": { "label": "Save a copy of the TrueNAS config backup file?", "type": "checkbox", "default": "no" },
					"TrueNASConfigBackupLocation": { "label": "Location of extra TrueNAS config file:", "type": "text", "default": "/tmp/" },
					"PowerTimeFormat": { "label": "Format for power-on hours string", "type": "select", "required": true, "default": "h", "options": [ "ymdh", "ymd", "ym", "y", "h"] },
					"TempDisplay":  { "label": "Format you desire the temperature to be displayed", "type": "select", "required": true, "default": "&deg; C", "options": [ "&deg; C", "*C", "^C", "^c"] },
					"Non_Exist_Value":  { "label": "Format you desire non-existent data to be displayed", "type": "text", "default": "---" },
					"Pool_Capacity_Type":  { "label": "Zpool Status Report - Pool Size and Free Space capacities", "type": "select", "required": true, "default": "zfs", "options": [ "zfs", "zpool"] },
					"Last_Test_Type_poh": { "label": "Include the Last Test Power On Hours", "type": "checkbox", "default": "enable" },
					"lastTestTypeHoursIdent": { "label": "Test to follow power on hours numbers.  Default=hrs", "type": "text", "default": "hrs" }
				}
			},

			"Time-Limited Error Recovery": {
				"label": "Time-Limited Error Recovery",
				"options": {
					"SCT_Enable": { "label": "Set to enable to send a command to enable SCT on your drives for user defined timeout.", "type": "checkbox", "default": "disable" },
					"SCT_Warning_Level": { "label": "TLER Warning Level", "type": "select", "required": true, "default": "TLER_No_Msg", "options": [ "TLER_No_Msg", "all", "TLER"] },
					"SCT_Read_Timeout": { "label": "Set to the read threshold. Default = 70 = 7.0 seconds.", "type": "number", "required": true, "min":0, "default": 70 },
					"SCT_Write_Timeout": { "label": "Set to the write threshold. Default = 70 = 7.0 seconds.", "type": "number", "required": true, "min":0, "default": 70 }			
				}
			},
			"F.A.R.M.": {
				"label": "F.A.R.M.",
				"options": {
					"DriveFARMCheck": { "label": "Enable F.A.R.M. checks", "type": "checkbox", "default": "enable" },
					"DriveFARMCheckHours": { "label": "F.A.R.M. - Maximum number of days different from S.M.A.R.T.", "type": "number", "required": true, "min":0, "default": 30 }
				}
			}
		},
		"Drive Customization": {
            __target: "#mr-tab2-acc2 .accordion-body",   
			"Drive Customization": {
				"label": "Drive Customization",
				"options": {
					"Ignore_Drives_List": { "label": "Ignore Drives List", "type": "text", "default": "" },
					"ATA_Errors_List": { "label": "ATA Errors List", "type": "text", "default": "" },
					"CRC_Errors_List": { "label": "CRC Errors List", "type": "text", "default": "" },
					"MultiZone_List": { "label": "MultiZone List", "type": "text", "default": "" },
					"ReAllocated_Sector_List": { "label": "ReAllocated Sector List", "type": "text", "default": "" },
					"ReAllocated_Sector_Events_List": { "label": "ReAllocated Sector Events List", "type": "text", "default": "" },
					"Media_Errors_List": { "label": "Media Errors List", "type": "text", "default": "" },
					"Custom_Drives_List": { "label": "Custom Drives List", "type": "text", "default": "" },
					"Drive_Locations": { "label": "Drive Locations", "type": "text", "default": "" },
					"Drive_Warranty_List": { "label": "Drive Warranty List", "type": "text", "default": "" }
				}
			}	
		},
		"Custom Report Configuration - Zpool": {
			__target: "#mr-tab3-acc4 .accordion-body",  
			"Custom Report Configuration - Zpool": {
				"label": "Custom Report Configuration - Zpool",
				"options": {                 
					"Zpool_Pool_Name_Title": { "label": "Zpool Pool Name Title", "type": "text", "default": "Pool Name" },
					"Zpool_Status_Title": { "label": "Zpool Status Title", "type": "text", "default": "Status" },
					"Zpool_Pool_Size_Title": { "label": "Zpool Pool Size Title", "type": "text", "default": "Pool Size"},
					"Zpool_Free_Space_Title": { "label": "Zpool Free Space Title", "type": "text", "default": "Free Space" },
					"Zpool_Used_Space_Title": { "label": "pool Used Space Title", "type": "text", "default": "Used Space" },
					"Zfs_Pool_Size_Title": { "label": "Zfs Pool Size Title", "type": "text", "default": "^Pool Size" },
					"Zfs_Free_Space_Title": { "label": "Zfs Free Space Title", "type": "text", "default": "^Free Space" },
					"Zfs_Used_Space_Title": { "label": "Zfs Used Space Title", "type": "text", "default": "^Used Space" },
					"Zpool_Frag_Title": { "label": "Zpool Frag Title", "type": "text", "default": "Frag" },			
					"Zpool_Read_Errors_Title": { "label": "Zpool Read Errors Title", "type": "text", "default": "Read Errors" },
					"Zpool_Write_Errors_Title": { "label": "Zpool Write Errors Title", "type": "text", "default": "Write Errors"},
					"Zpool_Checksum_Errors_Title": { "label": "Zpool Checksum Errors Title", "type": "text", "default": "Cksum Errors" },
					"Zpool_Scrub_Repaired_Title": { "label": "Zpool Scrub Repaired Title", "type": "text", "default": "Scrub Repaired Bytes" },
					"Zpool_Scrub_Errors_Title": { "label": "Zpool Scrub Errors Title", "type": "text", "default": "Scrub Errors" },
					"Zpool_Scrub_Age_Title": { "label": "Zpool Scrub Age Title", "type": "text", "default": "Last Scrub Age" },
					"Zpool_Scrub_Duration_Title": { "label": "Zpool Scrub Duration Title", "type": "text", "default": "Last Scrub Duration" },
					"Zpool_Total_Data_Written_Title": { "label": "Zpool Total Data Written Title", "type": "text", "default": "Total Data Read /<br> Total Data Written" }				
                }
            }
        },		
		"Custom Report Configuration - HDD": {
			__target: "#mr-tab3-acc5 .accordion-body",  
            "Custom Report Configuration - HDD": {
                "label": "Custom Report Configuration - HDD",
                "options": {
                    "HDD_Device_ID": { "label": "HDD Device ID", "type": "checkbox", "default": "enable" },
                    "HDD_Device_ID_Title": { "label": "HDD Device ID Title", "type": "text", "default": "Device ID" },
					"HDD_Serial_Number": { "label": "HDD Serial Number", "type": "checkbox", "default": "enable" },
					"HDD_Serial_Number_Title": { "label": "HDD Serial Number Title", "type": "text", "default": "Serial Number" },
					"HDD_Model_Number": { "label": "HDD Model Number", "type": "checkbox", "default": "enable" },
					"HDD_Model_Number_Title": { "label": "HDD Model Number Title", "type": "text", "default": "Model Number"},
					"HDD_Capacity": { "label": "HDD Capacity", "type": "checkbox", "default": "enable" },
					"HDD_Capacity_Title": { "label": "HDD Capacity Title", "type": "text", "default": "Capacity" },
					"HDD_Rotational_Rate": { "label": "Rotational Rate", "type": "checkbox", "default": "enable" },
					"HDD_Rotational_Rate_Title": { "label": "Rotational Rate Title", "type": "text", "default": "RPM" },
					"HDD_SMART_Status": { "label": "SMART Status", "type": "checkbox", "default": "enable" },
					"HDD_SMART_Status_Title": { "label": "SMART Status Title", "type": "text", "default": "SMART Status" },
					"HDD_Warranty": { "label": "HDD Warranty", "type": "checkbox", "default": "enable" },
					"HDD_Warranty_Title": { "label": "HDD Warranty Title", "type": "text", "default": "Warr- anty" },
					"HDD_Raw_Read_Error_Rate": { "label": "HDD Raw Read Rate Error", "type": "checkbox", "default": "enable" },
					"HDD_Raw_Read_Error_Rate_Title": { "label": "HDD Raw Read Rate Error Title", "type": "text", "default": "Raw Error Rate" },
					"HDD_Drive_Temp": { "label": "HDD Drive Temperature", "type": "checkbox", "default": "enable" },
					"HDD_Drive_Temp_Title": { "label": "HDD Drive Temperature Title", "type": "text", "default": "Curr Temp" },
					"HDD_Drive_Temp_Min": { "label": "HDD Drive Minimum Temperature", "type": "checkbox", "default": "enable" },
					"HDD_Drive_Temp_Min_Title": { "label": "HDD Drive Temperature Minimum Title", "type": "text", "default": "Temp Min" },
					"HDD_Drive_Temp_Max": { "label": "HDD Drive Maximum Temperature", "type": "checkbox", "default": "enable" },
					"HDD_Drive_Temp_Max_Title": { "label": "HDD Drive Maximum Temperature Title", "type": "text", "default": "Temp Max" },
					"HDD_Power_On_Hours": { "label": "HDD Power On Hours", "type": "checkbox", "default": "enable" },
					"HDD_Power_On_Hours_Title": { "label": "HDD Power On Hours Title", "type": "text", "default": "Power On Time" },
					"HDD_Start_Stop_Count": { "label": "HDD Start Stop Count", "type": "checkbox", "default": "enable" },
					"HDD_Start_Stop_Count_Title": { "label": "HDD Start Stop Count Title", "type": "text", "default": "Start Stop Count" },
					"HDD_Load_Cycle": { "label": "HDD Load Cycle", "type": "checkbox", "default": "enable" },
					"HDD_Load_Cycle_Title": { "label": "HDD Load Cycle Title", "type": "text", "default": "Load Cycle Count" },
					"HDD_Spin_Retry": { "label": "HDD Spin Retry", "type": "checkbox", "default": "enable" },
					"HDD_Spin_Retry_Title": { "label": "HDD Spin Retry Title", "type": "text", "default": "Spin Retry Count" },
					"HDD_Reallocated_Sectors": { "label": "HDD Reallocated Sectors", "type": "checkbox", "default": "enable" },
					"HDD_Reallocated_Sectors_Title": { "label": "HDD Reallocated Sectors Title", "type": "text", "default": "Re-alloc Sects" },
					"HDD_Reallocated_Events": { "label": "HDD Reallocated Events", "type": "checkbox", "default": "enable" },
					"HDD_Reallocated_Events_Title": { "label": "HDD Reallocated Events Title", "type": "text", "default": "Re-alloc Evnt" },
					"HDD_Pending_Sectors": { "label": "HDD Pending Sectors", "type": "checkbox", "default": "enable" },
					"HDD_Pending_Sectors_Title": { "label": "HDD Pending Sectors Title", "type": "text", "default": "Curr Pend Sects" },
					"HDD_Offline_Uncorrectable": { "label": "HDD Offline Uncorrectable Sectors", "type": "checkbox", "default": "enable" },
					"HDD_Offline_Uncorrectable_Title": { "label": "HDD_Offline_Uncorrectable Sectors Title", "type": "text", "default": "Offl Unc Sects" },
					"HDD_UDMA_CRC_Errors_List": { "label": "HDD UDMA CRC Errors List", "type": "checkbox", "default": "enable" },
					"HDD_UDMA_CRC_Errors_List_Title": { "label": "HDD UDMA CRC Errors_List Title", "type": "text", "default": "UDMA CRC Error" },
					"HDD_Seek_Error_Rate": { "label": "HDD Seek Error Rate", "type": "checkbox", "default": "enable" },
					"HDD_Seek_Error_Rate_Title": { "label": "HDD Seek Error Rate Title", "type": "text", "default": "Seek Error Rate" },
					"HDD_MultiZone_Errors": { "label": "HDD MultiZone Errors", "type": "checkbox", "default": "enable" },
					"HDD_MultiZone_Errors_Title": { "label": "HDD MultiZone Errors Title", "type": "text", "default": "Multi Zone Error" },
					"HDD_Helium_Level": { "label": "HDD Helium Level", "type": "checkbox", "default": "enable" },
					"HDD_Helium_Level_Title": { "label": "HDD Helium Level Title", "type": "text", "default": "He Level" },
					"HDD_Last_Test_Age": { "label": "HDD Last Test Age", "type": "checkbox", "default": "enable" },
					"HDD_Last_Test_Age_Title": { "label": "HDD Last Test Age Title", "type": "text", "default": "Last Test Age" },
					"HDD_Last_Test_Type": { "label": "HDD Last Test Type", "type": "checkbox", "default": "enable" },
					"HDD_Last_Test_Type_Title": { "label": "HDD Last Test Type Title", "type": "text", "default": "Last Test Type (time conducted)" },
					"HDD_Total_Data_Written": { "label": "HDD Total Data Written", "type": "checkbox", "default": "enable" },
					"HDD_Total_Data_Written_Title": { "label": "HDD Total Data Written Title", "type": "text", "default": "Lifetime Data Read<br>/ Written" },
					"HDD_Total_Data_Written_Month": { "label": "HDD Total Data Written_Month", "type": "checkbox", "default": "enable" },
					"HDD_Total_Data_Written_Month_Title": { "label": "HDD Total Data Written Month Title", "type": "text", "default": "Total Data Written 30 Days" }
                }
            }
        },		
		"Custom Report Configuration - SSD": {
			__target: "#mr-tab3-acc6 .accordion-body",  
            "Custom Report Configuration - SSD": {
                "label": "Custom Report Configuration - SSD",
                "options": {
                    "SSD_Device_ID": { "label": "SSD Device ID", "type": "checkbox", "default": "enable" },
                    "SSD_Device_ID_Title": { "label": "SSD Device ID Title", "type": "text", "default": "Device ID" },
					"SSD_Serial_Number": { "label": "SSD Serial Number", "type": "checkbox", "default": "enable" },
					"SSD_Serial_Number_Title": { "label": "SSD Serial Number Title", "type": "text", "default": "Serial Number" },
					"SSD_Model_Number": { "label": "SSD Model Number", "type": "checkbox", "default": "enable" },
					"SSD_Model_Number_Title": { "label": "SSD Model Number Title", "type": "text", "default": "Model Number"},
					"SSD_Capacity": { "label": "SSD Capacity", "type": "checkbox", "default": "enable" },
					"SSD_Capacity_Title": { "label": "SSD Capacity Title", "type": "text", "default": "Capacity" },
					"SSD_SMART_Status": { "label": "SMART Status", "type": "checkbox", "default": "enable" },
					"SSD_SMART_Status_Title": { "label": "SMART Status Title", "type": "text", "default": "SMART Status" },
					"SSD_Warranty": { "label": "SSD Warranty", "type": "checkbox", "default": "enable" },
					"SSD_Warranty_Title": { "label": "SSD Warranty Title", "type": "text", "default": "Warr- anty" },
					"SSD_Raw_Read_Error_Rate": { "label": "SSD Raw Read Rate Error", "type": "checkbox", "default": "enable" },
					"SSD_Raw_Read_Error_Rate_Title": { "label": "SSD Raw Read Rate Error Title", "type": "text", "default": "Raw Error Rate" },
					"SSD_Drive_Temp": { "label": "SSD Drive Temperature", "type": "checkbox", "default": "enable" },
					"SSD_Drive_Temp_Title": { "label": "SSD Drive Temperature Title", "type": "text", "default": "Curr Temp" },
					"SSD_Drive_Temp_Min": { "label": "SSD Drive Minimum Temperature", "type": "checkbox", "default": "enable" },
					"SSD_Drive_Temp_Min_Title": { "label": "SSD Drive Temperature Minimum Title", "type": "text", "default": "Temp Min" },
					"SSD_Drive_Temp_Max": { "label": "SSD Drive Maximum Temperature", "type": "checkbox", "default": "enable" },
					"SSD_Drive_Temp_Max_Title": { "label": "SSD Drive Maximum Temperature Title", "type": "text", "default": "Temp Max" },
					"SSD_Power_On_Hours": { "label": "SSD Power On Hours", "type": "checkbox", "default": "enable" },
					"SSD_Power_On_Hours_Title": { "label": "SSD Power On Hours Title", "type": "text", "default": "Power On Time" },
					"SSD_Wear_Level": { "label": "SSD Wear Level", "type": "checkbox", "default": "enable" },
					"SSD_Wear_Level_Title": { "label": "SSD Wear Level Title", "type": "text", "default": "Wear Level" },					
					"SSD_Reallocated_Sectors": { "label": "SSD Reallocated Sectors", "type": "checkbox", "default": "enable" },
					"SSD_Reallocated_Sectors_Title": { "label": "SSD Reallocated Sectors Title", "type": "text", "default": "Re-alloc Sects" },
					"SSD_Reallocated_Events": { "label": "SSD Reallocated Events", "type": "checkbox", "default": "enable" },
					"SSD_Reallocated_Events_Title": { "label": "SSD Reallocated Events Title", "type": "text", "default": "Re-alloc Evnt" },
					"SSD_Pending_Sectors": { "label": "SSD Pending Sectors", "type": "checkbox", "default": "enable" },
					"SSD_Pending_Sectors_Title": { "label": "SSD Pending Sectors Title", "type": "text", "default": "Curr Pend Sects" },
					"SSD_Offline_Uncorrectable": { "label": "SSD Offline Uncorrectable Sectors", "type": "checkbox", "default": "enable" },
					"SSD_Offline_Uncorrectable_Title": { "label": "SSD_Offline_Uncorrectable Sectors Title", "type": "text", "default": "Offl Unc Sects" },
					"SSD_UDMA_CRC_Errors_List": { "label": "SSD UDMA CRC Errors List", "type": "checkbox", "default": "enable" },
					"SSD_UDMA_CRC_Errors_List_Title": { "label": "SSD UDMA CRC Errors_List Title", "type": "text", "default": "UDMA CRC Error" },
					"SSD_Last_Test_Age": { "label": "SSD Last Test Age", "type": "checkbox", "default": "enable" },
					"SSD_Last_Test_Age_Title": { "label": "SSD Last Test Age Title", "type": "text", "default": "Last Test Age" },
					"SSD_Last_Test_Type": { "label": "SSD Last Test Type", "type": "checkbox", "default": "enable" },
					"SSD_Last_Test_Type_Title": { "label": "SSD Last Test Type Title", "type": "text", "default": "Last Test Type (time conducted)" },
					"SSD_Total_Data_Written": { "label": "SSD Total Data Written", "type": "checkbox", "default": "enable" },
					"SSD_Total_Data_Written_Title": { "label": "SSD Total Data Written Title", "type": "text", "default": "Lifetime Data Read<br>/ Written" },
					"SSD_Total_Data_Written_Month": { "label": "SSD Total Data Written_Month", "type": "checkbox", "default": "enable" },
					"SSD_Total_Data_Written_Month_Title": { "label": "SSD Total Data Written Month Title", "type": "text", "default": "Total Data Written 30 Days" }
                }
            }
        },
		"Custom Report Configuration - NVM": {
			__target: "#mr-tab3-acc7 .accordion-body",  
            "Custom Report Configuration - NVM": {
                "label": "Custom Report Configuration - NVM",
                "options": {
                    "NVM_Device_ID": { "label": "NVM Device ID", "type": "checkbox", "default": "enable" },
                    "NVM_Device_ID_Title": { "label": "NVM Device ID Title", "type": "text", "default": "Device ID" },
					"NVM_Serial_Number": { "label": "NVM Serial Number", "type": "checkbox", "default": "enable" },
					"NVM_Serial_Number_Title": { "label": "NVM Serial Number Title", "type": "text", "default": "Serial Number" },
					"NVM_Model_Number": { "label": "NVM Model Number", "type": "checkbox", "default": "enable" },
					"NVM_Model_Number_Title": { "label": "NVM Model Number Title", "type": "text", "default": "Model Number"},
					"NVM_Capacity": { "label": "NVM Capacity", "type": "checkbox", "default": "enable" },
					"NVM_Capacity_Title": { "label": "NVM Capacity Title", "type": "text", "default": "Capacity" },
					"NVM_SMART_Status": { "label": "SMART Status", "type": "checkbox", "default": "enable" },
					"NVM_SMART_Status_Title": { "label": "SMART Status Title", "type": "text", "default": "SMART Status" },
					"NVM_Warranty": { "label": "NVM Warranty", "type": "checkbox", "default": "enable" },
					"NVM_Warranty_Title": { "label": "NVM Warranty Title", "type": "text", "default": "Warr- anty" },
					"NVM_Critical_Warning": { "label": "NVM Critical Warning", "type": "checkbox", "default": "enable" },
					"NVM_Critical_Warning_Title": { "label": "NVM Critical Warning Title", "type": "text", "default": "Critical Warning" },
					"NVM_Drive_Temp": { "label": "NVM Drive Temperature", "type": "checkbox", "default": "enable" },
					"NVM_Drive_Temp_Title": { "label": "NVM Drive Temperature Title", "type": "text", "default": "Curr Temp" },
//					"NVM_Drive_Temp_Min": { "label": "NVM Drive Minimum Temperature", "type": "checkbox", "default": "enable" },
//					"NVM_Drive_Temp_Min_Title": { "label": "NVM Drive Temperature Minimum Title", "type": "text", "default": "Temp Min" },
//					"NVM_Drive_Temp_Max": { "label": "NVM Drive Maximum Temperature", "type": "checkbox", "default": "enable" },
//					"NVM_Drive_Temp_Max_Title": { "label": "NVM Drive Maximum Temperature Title", "type": "text", "default": "Temp Max" },
					"NVM_Power_Level": { "label": "NVM Power Level", "type": "checkbox", "default": "enable" },
					"NVM_Power_Level_Title": { "label": "NVM Power Level Title", "type": "text", "default": "Power State" },
					"NVM_Power_On_Hours": { "label": "NVM Power On Hours", "type": "checkbox", "default": "enable" },
					"NVM_Power_On_Hours_Title": { "label": "NVM Power On Hours Title", "type": "text", "default": "Power On Time" },
					"NVM_Wear_Level": { "label": "NVM Wear Level", "type": "checkbox", "default": "enable" },
					"NVM_Wear_Level_Title": { "label": "NVM Wear Level Title", "type": "text", "default": "Wear Level" },
					"NVM_Media_Error": { "label": "NVM Media Error", "type": "checkbox", "default": "enable" },
					"NVM_Media_Error_Title": { "label": "NVM Media Error Title", "type": "text", "default": "Media Errors" },
					"NVM_Last_Test_Age": { "label": "NVM Last Test Age", "type": "checkbox", "default": "enable" },
					"NVM_Last_Test_Age_Title": { "label": "NVM Last Test Age Title", "type": "text", "default": "Last Test Age" },
					"NVM_Last_Test_Type": { "label": "NVM Last Test Type", "type": "checkbox", "default": "enable" },
					"NVM_Last_Test_Type_Title": { "label": "NVM Last Test Type Title", "type": "text", "default": "Last Test Type (time conducted)" },
					"NVM_Total_Data_Written": { "label": "NVM Total Data Written", "type": "checkbox", "default": "enable" },
					"NVM_Total_Data_Written_Title": { "label": "NVM Total Data Written Title", "type": "text", "default": "Lifetime Data Read<br>/ Written" },
					"NVM_Total_Data_Written_Month": { "label": "NVM Total Data Written_Month", "type": "checkbox", "default": "enable" },
					"NVM_Total_Data_Written_Month_Title": { "label": "NVM Total Data Written Month Title", "type": "text", "default": "Total Data Written 30 Days" }
                }
            }
        },
		"Global table of colors": {
            __target: "#mr-tab4-acc2 .accordion-body",
			"Color customization": {
				"label": "Variable list",
				"options": {
					"expiredWarrantyBoxColor": { "label": "\"black\" = normal box perimeter color.", "type": "colorpicker", "required": true, "default": "#000000" },
                    "WarrantyBackgndColor": { "label": "Background color for expired drives. \"none\" = normal background", "type": "colorpicker", "required": true, "default": "#f1ffad" },
                    "okColor": { "label": "Hex code for color to use in SMART Status column if drives pass (default is darker light green, #b5fcb9)", "type": "colorpicker", "required": true, "default": "#F38B16" },
                    "warnColor": { "label": "Hex code for WARN color (default is orange, #F38B16)", "type": "colorpicker", "required": true, "default": "#F38B16" },
                    "critColor": { "label": "Hex code for CRITICAL color (default is red, #f44336)", "type": "colorpicker", "required": true, "default": "#f44336" },
                    "altColor": { "label": "Table background alternates row colors between white and this color (default is light gray, #f4f4f4)", "type": "colorpicker", "required": true, "default": "#f4f4f4" },
                    "whtColor": { "label": "Hex for White background", "type": "colorpicker", "required": true, "default": "#ffffff" },
                    "ovrdColor": { "label": "Hex code for Override Yellow", "type": "colorpicker", "required": true, "default": "#ffffe4" },
                    "blueColor": { "label": "Hex code for Sky Blue, used for the SCRUB/SMART Test In Progress/background", "type": "colorpicker", "required": true, "default": "#87ceeb" },
                    "yellowColor": { "label": "Hex code for pale yellow", "type": "colorpicker", "required": true, "default": "#f1ffad" },
                    "pohColor": { "label": "Hex code for pale yellow", "type": "colorpicker", "required": true, "default": "#ffffcc" },   
                    "tdrcolor": { "label": "Hex code for 30-Day Read Percentage Value", "type": "colorpicker", "required": true, "default": "#008000" },
                    "tdwcolor": { "label": "Hex code for 30-Day Write Percentage Value", "type": "colorpicker", "required": true, "default": "#0000FF" }                                     
				}
			}
        }
    
};

// fields tooltip
window.MRCE.TOOLTIPS = {
        "Email Address Settings": {
            "Email": "Normal email address to send report.",
            "From": "From address (default works for many). Use only address accepted by your provider, if using Outlook OAuth, try = blank.",
			"FromName": "From Name. This will not impact delivery"
        },			
        "Alert Email Configuration (-m switch)": {
            "AlertEmail": "Email address to send report when using the `-m` switch.",
            "AlertOnWarningTemp": "Send alert on Warning Temp. Default=enable",
            "AlertOnWarningError": "Send alert on Warning Error.  Default=enable",			
            "AlertOnCriticalError": "Send alert on Critical Error.  Default=enable"
        },
		"Email On Alarm ONLY": {
			"Email_On_Alarm_Only": "When enable, an email will only be sent if an alarm condition exists.  Default=disable",
			"Email_On_Alarm_Only_And_Attachments": "When enable, email attachments will be sent even when no alarm condition exists.  Default=enable"
        },
        "Attach multi_report_config.txt to Email": {
            "MRConfigEmailEnable": "Enable attaching the multi_report_config.txt configuration file to email.",
            "MRConfigEmailDay": "Day of the week to email the configuration file.",
			"MRChangedEmailSend": "If enable will attach the updated/changed configuration file to the email.  This would happen during an update. Default=enable"
        },
		"Statistical Data File": {
			"SDF_DataPurgeDays": "Set to the number of day you wish to keep in the data.  Older data will be purged. Default is 730 days (2 years). 0=Disable.",
			"SDF_DataEmail": "Do you want a copy of the Statistical Data File emailed to you?",
			"SDF_DataEmailDay": "Set to the day of the week the statistical report is emailed."
		},
        "Attach TrueNAS Configuration files to Email": {
            "TrueNASConfigEmailEnable": "Enable emailing of TrueNAS configuration backups.",
            "TrueNASConfigEmailDay": "Day of the week to email the configuration backup."
        },		
		"Backup File Locations": {
            "TrueNASConfigBackupSave": "Save a copy of the TrueNAS configuration backup.",
            "TrueNASConfigBackupLocation": "Location to save the TrueNAS configuration backup."		
		},	
		"Drive-Selftest2": {
            "TrueNASConfigBackupSave": "Save a copy of the TrueNAS configuration backup.",
            "TrueNASConfigBackupLocation": "Location to save the TrueNAS configuration backup."		
		},
        "Statistical Data File (SDF)": {
            "statistical_data_file": "The file path and name for the Statistical Data File.",
            "SDF_DataRecordEnable": "Enable recording of statistical data.",
			"SDF_DataPurgeDays": "Set the number of days the statistical data file should retain.",
			"SDF_DataEmail": "Set to enable to have an attachment of the file emailed to you.",
            "add_new_drive_factor": "Factor for adding new drives to the statistical data."
        },
        "Report Chart Configuration": {
			"chartfont": "Typical options are: courier new, times new roman, Cascadia Code, stencil, OCR A Extended, etc.  NOTE: Chart fonts look better if they are a proportional font.",
			"chart_font_size":"Typical options are: 14, 16, 18.  This only affects the Chart fonts, not the Text fonts.",
			"Subject_Line_Normal": "Email Subject Line for normal good reports.  ${host} is the name of the server.",
			"Subject_Line_Warning": "Email Subject Line for warning error reports.  ${host} is the name of the server.",
            "Subject_Line_Critical": "Email Subject Line for critical error reports.  ${host} is the name of the server.",
			"HDDreportTitle": "This is the title of the HDD report.",
			"SSDreportTitle": "This is the title of the SSD report.",
			"NVMreportTitle": "This is the title of the NVMe report."

        },
        "Report Configuration": {
			"Enable_Text_Section": "This will display the Text Section below the CHART.  Default=enable",
			"font": "Typical options are: courier new, times new roman, Cascadia Code, stencil, OCR A Extended, etc.  NOTE: Text fonts look better if they are a monospace font.",
			"font_size":"Typical options are: 14, 16, 18.  This only affects the Text Section fonts, not the Chart fonts.",
			"Total_Data_Written_Month": "Options are: month for Current Month, or 30Days for the previous rolling 30 days.",
			"Enable_Messages": "This will enable the Warning/Caution type messages. Default=enable",
			"Enable_Zpool_Messages": "This will list all zpool -v status and identify drives by gptid to drive ident.  Default=enable",
            "Enable_SMART_Messages": "This will output SMART data if available.  Default=enable",
			"ReportNonSMART": "Will force even non-SMART devices to be reported.  Default=enable",
			"DisableRAWdata": "Remove the smartctl -a data and non-smart data appended to the normal report. Default=disable",
			"ATA_Auto_Enable": "Automatically update Log Error count to only display a log error when a new one occurs.  Default=disable",
			"zfs_report_enable": "Enable the ZFS report section.",
            "zfs_report_only_on_error": "Only send the ZFS report if an error is found.",
			"smart_report_enable": "Enable the SMART report section.",
            "send_smart_report_only_on_error": "Only send the SMART report if an error is found.",
			"scrub_report_enable": "Enable the scrub report section.",
            "scrub_report_only_on_error": "Only send the scrub report if an error is found."

        },
		"Alarm Thresholds - Temperature": {
			"PoolUsedWarn": "Pool used percentage before Warning.  Default=80",
			"ScrubAgeWarn": "Maximum age (in days) of last pool scrub before Warning. Default=37",
			"ZpoolFragWarn": "Percent of fragmentation before a Warning message occurs.  Default=80",
			"HDDtempWarn": "HDD Drive Warning Temp (in C) when a WARNING message will be used.  Default=45",
			"HDDtempCrit": "HDD Drive Critical Temp (in C) when a CRITICAL message will be used.  Default=50",
			"SSDtempWarn": "SSD Drive Warning Temp (in C) when a WARNING message will be used.  Default=50",
			"SSDtempCrit": "SSD Drive Critical Temp (in C) when a CRITICAL message will be used.  Default=60",
			"NVMtempWarn": "NVM Drive Warning Temp (in C) when a WARNING message will be used.  Default=55",
			"NVMtempCrit": "NVM Drive Critical Temp (in C) when a CRITICAL message will be used.  Default=65",
			"HDD_Cur_Pwr_Max_Temp_Ovrd": "HDD Max Drive Temp Override. This value when enable will NOT alarm on any Current Power Cycle Max Temperature Limit.  Default=disabled",
			"SSD_Cur_Pwr_Max_Temp_Ovrd": "SSD Max Drive Temp Override. This value when enable will NOT alarm on any Current Power Cycle Max Temperature Limit.  Default=disabled",
			"NVM_Cur_Pwr_Max_Temp_Ovrd": "NVMe Max Drive Temp Override. This value when enable will NOT alarm on any Current Power Cycle Max Temperature Limit.  Default=disabled"
		},		
		"Alarm Thresholds - Media":{
			"SectorsWarn": "How many sector errors before a Warning message.",
			"SectorsCrit": "How many sector errors before a Critical message.",
			"ReAllocWarn": "How many Reallocated sectors before a WARNING message.",
			"MultiZoneWarn": "How many MultiZone errors before WARNING message.  Default is 0.",
			"MultiZoneCrit": "How many MultiZone errors before Critical message.  Default is 5.",
			"DeviceRedFlag": "Set to enable to have the Device Column indicate RED for ANY alarm condition.  Default is enable.",
			"HeliumAlarm": "Set to enable to set for a critical alarm any He value below HeliumMin value.  Default is enable.",
			"HeliumMin": "Set to 100 for a zero leak helium result.  An alert will occur below this value.",
			"RawReadWarn": "Read errors allowable before WARNING message.",
			"RawReadCrit": "Read errors allowable before Critical message.",
			"SeekErrorsWarn": "Seek errors allowable before WARNING message.",
			"SeekErrorsCrit": "Seek errors allowable before Critical message.",
			"NVM_Media_Errors": "Number of NVMe Media Errors before alarm with a CRITICAL message.",
			"WearLevelCrit": "Wear Level Alarm Setpoint when a WARNING message. 9% is the default.",
			"TestWarnAge": "Maximum age (in days) of last SMART test before CRITICAL color/message will be used.",
			"NVMe_Ignore_Invalid_Errors": "NVMe Ignore Invalid Field in Command messages.  Default is disabled."
		},		
		"Time-Limited Error Recovery": {
			"SCT_Enable": "Enable to send a command to enable SCT on your drives for user defined timeout.",
			"SCT_Warning_Level": "All=Will generate a Warning Message for all devices not reporting SCT enabled. TLER=Reports only drive which support TLER. TLER_No_Msg=Will only report for TLER drives and not report a Warning Message if the drive can set TLER on. Default=TLER_No_Msg",
			"SCT_Read_Timeout": "Set to the read threshold. Default = 70 = 7.0 seconds.",
			"SCT_Write_Timeout": "Set to the write threshold. Default = 70 = 7.0 seconds."
		},
		"Updates": {
			"Check_For_Updates": "Will check GitHub for updates and include message in next email.",
			"Automatic_MR_Update": "# WARNING !!!  This option will automatically update the Multi-Report script if a newer version exists on GitHub.",
			"Automatic_Selftest_Update": "# WARNING !!!  This option will automatically update the Drive_Selftest script if a newer version exists on GitHub.",
			"Automatic_Sendemail_Update": "# WARNING !!!  This option will automatically update the Sendermail.py script if a newer version exists on GitHub."
		},
		"General Configuration": {
			"Use_multi_report_config_values": "An enable value here will use the multi_report_config.txt file values to override the values defined within the Drive_Selftest script.  Default = enable",
			"Test_ONLY_NVMe_Drives": "ONLY test NVMe drives.",
			"Track_Drive_Testing_Dates": "Enable Drive Testing Tracking which will generate a small CSV file which recordes the most recent SMART Short and Long tests for each drive.",
			"Enable_Logging": "Generate a text file that records how the S.M.A.R.T. testing performed.",
			"LOG_DIR": "DS Logs directory.  Default=$SCRIPT_DIR/DS_Logs",
			"Silent": "Only a few status messages and error messages will be output to the stdout.",
			"selftest_data_file": "Location and file name for tracking the selftest drive dates.",
			"External_SMART_Testing": "When set to enable it will check if drive_selftest.sh is present and run it.",
			"External_Script_Name": "Default setting is $SCRIPT_DIR/drive_selftest.sh",
			"Override_SMART_Disabled": "This will enable S.M.A.R.T. for any drive which supports S.M.A.R.T. but was Disabled due to the user disabling S.M.A.R.T.  It will return the drive to its previous state once the testing has completed."

		},
		"SCRUB and RESILVER (with respect to this testing)": {
			"SCRUB_Minutes_Remaining": "This option when set between 1 and 9999 (in minutes) will not run a SMART LONG test on a pool if a SCRUB has longer than xx minutes remaining, and a SMART SHORT test will be run instead to provide minimal impact to the SCRUB operation. A value of 0 (zero) will disable all SMART test(s) on the affected pool during a SCRUB operation.  Default=60",
			"SCRUB_RESILVER_OVERRIDE": "Allow all SCRUB/RESILVER actions to occur regardless of the SCRUB_Minutes_Remaining.",
			"Maximum_Catchup_Drive_Count": "Maximum number of drives to add to the Long testing list if some drives were not tested before by thier due date. NOTE: Enable Drive Testing Tracking must be enabled."
		},
		"Short Tests Group 1": {
			"Short_Test_Mode": "Test Modes are: 1=Used the Test Mode 1 settings to determine drives to test, 2=All drives are tested, 3=No drives tested.",
			"Short_Time_Delay_Between_Drives": "XX second delay between the drives starting testing.",
			"Short_Drives_Test_Delay": "Delay when running Short tests, before exiting to controlling procedure."
		},
		"Short Tests Group (Test Mode 1 only)": {
			"Short_SMART_Testing_Order": "Sorting order",
			"Short_Drives_to_Test_Per_Day": "How many drives to run each day minimum, for Test Mode 1 ONLY.",
			"Short_Drives_Test_Period": "Testing Period: Week=(7 days) or Month=(28 days)",
			"Short_Drives_Tested_Days_of_the_Week": "Days of the week testing is allowed."
		},
		"Long Tests Group 1": {
			"Long_Test_Mode": "Test Modes are: 1=Used the Test Mode 1 settings to determine drives to test, 2=All drives are tested, 3=No drives tested.",
			"Long_Time_Delay_Between_Drives": "XX second delay between the drives starting testing.",
			"Long_Drives_Test_Delay": "Delay when running Long tests, before exiting to controlling procedure."
		},
		"Long Tests Group (Test Mode 1 only)": {
			"Long_SMART_Testing_Order": "Test Sort Order",
			"Long_Drives_to_Test_Per_Day": "How many drives to run each day minimum, for Test Mode 1 ONLY.",
			"Long_Drives_Test_Period": "Testing Period: Week=(7 days) or Month=(28 days)",
			"Long_Drives_Tested_Days_of_the_Week": "Days of the week testing is allowed."
		},				
		"SMARTCTL Interface Options": {
			"SMARTCTL_Interface_Options": "This allows you to enter other possible interface values in order to typically get a USB connected drive to talk.  Default=auto,sat,atacam,scsi,nvme"
		},				
		"Partition Check and Backup": {
			"Partition_Check": "Run a partition check on each drive using sgdisk utility. Default=disable.",
			"Partition_Backup": "Include a copy of every partition table with the TrueNAS configuration backup. NOTE: Multi-Report does not restore partition data."
		},		
		"Spencer Integration": {
			"spencer_enable": "Run the Spencer.py script if installed and enable.  Default = enable",
			"spencer_script_name": "The default is spencer.py located in the default script directory.",
			"spencer_existing_warning_level": "What to do for an existing error.  Default = None",
			"spencer_new_warning_level": "What to do if a new error occurs.  Default = Warning"
		},				
		"SMR Checks": {
			"SMR_Enable": "Enable for if you want SMR operations.  Default = enable",
			"SMR_Update": "Will download smr-check.sh file from Github if the file does not exist (will not update to newer version automatically).  Default = enable",
			"SMR_Ignore_Alarm": "When enable, will not generate an alarm condition, however the Drive ID will still change the background color.  Default = disable",
			"SMR_New_Drive_Det_Count": "How many times a drive is checked before being ignored.  Default=14, Disable=0"
		},
		"Other Settings": {
			"Ignore_Lock": "When CHECKED (set to enable), the script will not check for multiple instances of multi_report.sh running. Default=disable",
			"NVM_Low_Power": "Set the NVMe power level to the minimum setting. This does not mean the NVMe will remain at this power level. Only valid in CORE.",
			"Multipath": "off=No processing of serial numbers, normal=Automatically remove duplicate serial numbers, Exos2x=Remove duplicate serial numbers ONLY IF the gptid matches, serial=Sort by serial numbers. Default=off",
			"Run_SMART_No_power_on_time": "Some SCSI drives do not report power_on_time, yet they report SMART Self-test times. This option will attempt to obtain the power on hours differently.",
			"TrueNASConfigBackupSave": "Set: no=to delete TrueNAS config backup after mail is sent; yes= keep it in dir in next option.",
			"TrueNASConfigBackupLocation": "Directory in which to store the backup FreeNAS config files.",
			"PowerTimeFormat": "Format for power-on hours string, valid options are ymdh, ymd, ym, y, or h (year month day hour).",
			"TempDisplay": "Format for the temperature to be displayed. Common formats are: &deg; C, *C, ^C, or ^c. Choose your own.",
			"Non_Exist_Value": "How do you desire non-existent data to be displayed.  The Default is ---, popular options are N/A, or blank.",
			"Pool_Capacity_Type": "Select zfs or zpool for Zpool Status Report - Pool Size and Free Space capacities.  Default=zfs.",
			"Last_Test_Type_poh": "Include the Last Test Power On Hours.",
			"lastTestTypeHoursIdent": "Text to follow power on hours numbers.  Default=hrs."
		},		
		"F.A.R.M.": {
			"DriveFARMCheck": "Check all drives with F.A.R.M. data with S.M.A.R.T. data.  Default=enable",
			"DriveFARMCheckHours": "Maximum difference in days that FARM can be greater than SMART Power On Hours. Default=30"		
		},		
		"Ignore or Activate Alarms": {
			"IgnoreUDMA": "Ignore all UltraDMA CRC Errors for the summary alarm (Email Header) only, errors will appear in the graphical chart. Default=disable",
			"IgnoreSeekError": "Ignore all Seek Error Rate/Health errors.  Default=enable",
			"IgnoreReadError": "Ignore all Read Error Rate/Health errors.  Default=enable",
			"IgnoreMultiZone": "Ignore all MultiZone Errors. Default=disable",
			"DisableWarranty": "Disable Email Subject line alerts for any expired warranty alert. The Email body will still report the alert. Default=enable"
		
		},		
		"Drive Customization": {
			"Ignore_Drives_List": "Use this to list any drives to ignore and remove from the report.",
			"ATA_Errors_List": "Offset ATA Errors.  Format: Drive S/N:Offset Value, Drive S/N:Offset Value",
			"CRC_Errors_List": "Offset CRC Errors.  Format: Drive S/N:Offset Value, Drive S/N:Offset Value",
			"MultiZone_List": "Offset MultiZone Errors.  Format: Drive S/N:Offset Value, Drive S/N:Offset Value",
			"ReAllocated_Sector_List": "Offset Reallocated Sector Errors.  Format: Drive S/N:Offset Value, Drive S/N:Offset Value",
			"ReAllocated_Sector_Events_List": "Offset Reallocated Sector Events.  Format: Drive S/N:Offset Value, Drive S/N:Offset Value",
			"Media_Errors_List": "Offset Media Errors.  Format: Drive S/N:Offset Value, Drive S/N:Offset Value",
			"Custom_Drives_List": "See Help for details.",
			"Drive_Locations": "Identify Drive Location.  Format: Drive S/N:Text of location,Drive S/N:Text of location",
			"Drive_Warranty_List": "Specify the drive warranty date.  Format: Drive S/N:YYYY-MM-DD,Drive S/N:YYYY-MM-DD"
		},
		"Custom Report Configuration - Zpool": {
		
			"Zpool_Pool_Name_Title": "Title of Column",
			"Zpool_Status_Title": "Title of Column",
			"Zpool_Pool_Size_Title": "Title of Column",
			"Zpool_Free_Space_Title": "Title of Column",
			"Zpool_Used_Space_Title": "Title of Column",
			"Zfs_Pool_Size_Title": "Title of Column",
			"Zfs_Free_Space_Title": "Title of Column",
			"Zfs_Used_Space_Title": "Title of Column",
			"Zpool_Frag_Title": "Title of Column",
			"Zpool_Read_Errors_Title": "Title of Column",
			"Zpool_Write_Errors_Title": "Title of Column",
			"Zpool_Checksum_Errors_Title": "Title of Column",
			"Zpool_Scrub_Repaired_Title": "Title of Column",
			"Zpool_Scrub_Errors_Title": "Title of Column",
			"Zpool_Scrub_Age_Title": "Title of Column",
			"Zpool_Scrub_Duration_Title": "Title of Column",
			"Zpool_Total_Data_Written_Title": "Title of Column"
		
		},		
        "Custom Report Configuration - HDD": {
			"HDD_Device_ID": "Check to Show",
			"HDD_Device_ID_Title": "Title of Column",
			"HDD_Serial_Number": "Check to Show",
			"HDD_Serial_Number_Title": "Title of Column",
			"HDD_Model_Number": "Check to Show",
			"HDD_Model_Number_Title": "Title of Column",
			"HDD_Capacity": "Check to Show",
			"HDD_Capacity_Title": "Title of Column",
			"HDD_Rotational_Rate": "Check to Show",
			"HDD_Rotational_Rate_Title": "Title of Column",
			"HDD_SMART_Status": "Check to Show",
			"HDD_SMART_Status_Title": "Title of Column",
			"HDD_Warranty": "Check to Show",
			"HDD_Warranty_Title": "Title of Column",
			"HDD_Raw_Read_Error_Rate": "Check to Show",
			"HDD_Raw_Read_Error_Rate_Title": "Title of Column",
			"HDD_Drive_Temp": "Check to Show",
			"HDD_Drive_Temp_Title": "Title of Column",
			"HDD_Drive_Temp_Min": "Check to Show",
			"HDD_Drive_Temp_Min_Title": "Title of Column",
			"HDD_Drive_Temp_Max": "Check to Show",
			"HDD_Drive_Temp_Max_Title": "Title of Column",
			"HDD_Power_On_Hours": "Check to Show",
			"HDD_Power_On_Hours_Title": "Title of Column",
			"HDD_Start_Stop_Count": "Check to Show",
			"HDD_Start_Stop_Count_Title": "Title of Column",
			"HDD_Load_Cycle": "Check to Show",
			"HDD_Load_Cycle_Title": "Title of Column",
			"HDD_Spin_Retry": "Check to Show",
			"HDD_Spin_Retry_Title": "Title of Column",
			"HDD_Reallocated_Sectors": "Check to Show",
			"HDD_Reallocated_Sectors_Title": "Title of Column",
			"HDD_Reallocated_Events": "Check to Show",
			"HDD_Reallocated_Events_Title": "Title of Column",
			"HDD_Pending_Sectors": "Check to Show",
			"HDD_Pending_Sectors_Title": "Title of Column",
			"HDD_Offline_Uncorrectable": "Check to Show",
			"HDD_Offline_Uncorrectable_Title": "Title of Column",
			"HDD_UDMA_CRC_Errors_List": "Check to Show",
			"HDD_UDMA_CRC_Errors_List_Title": "Title of Column",
			"HDD_Seek_Error_Rate": "Check to Show",
			"HDD_Seek_Error_Rate_Title": "Title of Column",
			"HDD_MultiZone_Errors": "Check to Show",
			"HDD_MultiZone_Errors_Title": "Title of Column",
			"HDD_Helium_Level": "Check to Show",
			"HDD_Helium_Level_Title": "Title of Column",
			"HDD_Last_Test_Age": "Check to Show",
			"HDD_Last_Test_Age_Title": "Title of Column",
			"HDD_Last_Test_Type": "Check to Show",
			"HDD_Last_Test_Type_Title": "Title of Column",
			"HDD_Total_Data_Written": "Check to Show",
			"HDD_Total_Data_Written_Title": "Title of Column",
			"HDD_Total_Data_Written_Month": "Check to Show",
			"HDD_Total_Data_Written_Month_Title": "Title of Column"
		},
		"Custom Report Configuration - SSD": {
			"SSD_Device_ID": "Check to Show",
			"SSD_Device_ID_Title": "Title of Column",
			"SSD_Serial_Number": "Check to Show",
			"SSD_Serial_Number_Title": "Title of Column",
			"SSD_Model_Number": "Check to Show",
			"SSD_Model_Number_Title": "Title of Column",
			"SSD_Capacity": "Check to Show",
			"SSD_Capacity_Title": "Title of Column",
			"SSD_SMART_Status": "Check to Show",
			"SSD_SMART_Status_Title": "Title of Column",
			"SSD_Warranty": "Check to Show",
			"SSD_Warranty_Title": "Title of Column",
			"SSD_Raw_Read_Error_Rate": "Check to Show",
			"SSD_Raw_Read_Error_Rate_Title": "Title of Column",
			"SSD_Drive_Temp": "Check to Show",
			"SSD_Drive_Temp_Title": "Title of Column",
			"SSD_Drive_Temp_Min": "Check to Show",
			"SSD_Drive_Temp_Min_Title": "Title of Column",
			"SSD_Drive_Temp_Max": "Check to Show",
			"SSD_Drive_Temp_Max_Title": "Title of Column",
			"SSD_Power_On_Hours": "Check to Show",
			"SSD_Power_On_Hours_Title": "Title of Column",
			"SSD_Wear_Level": "Check to Show",
			"SSD_Wear_Level_Title": "Title of Column",
			"SSD_Reallocated_Sectors": "Check to Show",
			"SSD_Reallocated_Sectors_Title": "Title of Column",
			"SSD_Reallocated_Events": "Check to Show",
			"SSD_Reallocated_Events_Title": "Title of Column",
			"SSD_Pending_Sectors": "Check to Show",
			"SSD_Pending_Sectors_Title": "Title of Column",
			"SSD_Offline_Uncorrectable": "Check to Show",
			"SSD_Offline_Uncorrectable_Title": "Title of Column",
			"SSD_UDMA_CRC_Errors_List": "Check to Show",
			"SSD_UDMA_CRC_Errors_List_Title": "Title of Column",
			"SSD_Last_Test_Age": "Check to Show",
			"SSD_Last_Test_Age_Title": "Title of Column",
			"SSD_Last_Test_Type": "Check to Show",
			"SSD_Last_Test_Type_Title": "Title of Column",
			"SSD_Total_Data_Written": "Check to Show",
			"SSD_Total_Data_Written_Title": "Title of Column",
			"SSD_Total_Data_Written_Month": "Check to Show",
			"SSD_Total_Data_Written_Month_Title": "Title of Column"
		},
		"Custom Report Configuration - NVM": {
			"NVM_Device_ID": "Check to Show",
			"NVM_Device_ID_Title": "Title of Column",
			"NVM_Serial_Number": "Check to Show",
			"NVM_Serial_Number_Title": "Title of Column",
			"NVM_Model_Number": "Check to Show",
			"NVM_Model_Number_Title": "Title of Column",
			"NVM_Capacity": "Check to Show",
			"NVM_Capacity_Title": "Title of Column",

			"NVM_SMART_Status": "Check to Show",
			"NVM_SMART_Status_Title": "Title of Column",
			"NVM_Warranty": "Check to Show",
			"NVM_Warranty_Title": "Title of Column",
			"NVM_Critical_Warning": "Check to Show",
			"NVM_Critical_Warning_Title": "Title of Column",
			"NVM_Drive_Temp": "Check to Show",
			"NVM_Drive_Temp_Title": "Title of Column",
//			"NVM_Drive_Temp_Min": "Check to Show",
//			"NVM_Drive_Temp_Min_Title": "Title of Column",
//			"NVM_Drive_Temp_Max": "Check to Show",
//			"NVM_Drive_Temp_Max_Title": "Title of Column",

			"NVM_Power_Level": "Check to Show",
			"NVM_Power_Level_Title": "Title of Column",
			
			"NVM_Power_On_Hours": "Check to Show",
			"NVM_Power_On_Hours_Title": "Title of Column",
			"NVM_Wear_Level": "Check to Show",
			"NVM_Wear_Level_Title": "Title of Column",
			

			"NVM_Media_Error": "Check to Show",
			"NVM_Media_Error_Title": "Title of Column",
			
			"NVM_Last_Test_Age": "Check to Show",
			"NVM_Last_Test_Age_Title": "Title of Column",
			"NVM_Last_Test_Type": "Check to Show",
			"NVM_Last_Test_Type_Title": "Title of Column",
			"NVM_Total_Data_Written": "Check to Show",
			"NVM_Total_Data_Written_Title": "Title of Column",
			"NVM_Total_Data_Written_Month": "Check to Show",
			"NVM_Total_Data_Written_Month_Title": "Title of Column"
		},
};

// fields to disable when short test is not test mode 1
window.MRCE.shortRelated = [
    "Short_SMART_Testing_Order",
    "Short_Drives_to_Test_Per_Day",
    "Short_Drives_Test_Period",
    "Short_Drives_Tested_Days_of_the_Week"
];

// fields to disable when long test is not test mode 1  
window.MRCE.longRelated = [
    "Long_SMART_Testing_Order",
    "Long_Drives_to_Test_Per_Day",
    "Long_Drives_Test_Period",
    "Long_Drives_Tested_Days_of_the_Week",
];  



