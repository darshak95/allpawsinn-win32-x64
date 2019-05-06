// ---------------------------------------- TO DO ----------------------------------------
// -- Calendar shouldnt re-render on search
'use babel';

import React from 'react'
import ReactDOM from 'react-dom'
import Navbar from './Navbar'
import Screen from './Screen'
import Sidescreen from './Sidescreen'

const sqlConfig = require('../js/sqlconfig')
const sql = require('mssql')
const booking_lib = require('../js/bookinglib')

export default class Main extends React.Component {
	constructor(props){
		super(props)
		this.state = {
			dog_list : [],
			booking_list : [],
			alerts : [],
			notifications : [],
			kennel_map: [],
            bozun_objesi: {},
            extraService_List: [],
            adminSetting_List: [],
            adminSetting:{},
            paid:0
           
		}
		this.grabDogs()
		this.get_daycare = this.get_daycare.bind(this)
	}

	componentWillMount(){
		this.setState({
			screen : "",
			sidescreen : false,
			query : ""
		})

		this.updateScreen = this.updateScreen.bind(this)
		this.toggle_side = this.toggle_side.bind(this)
		this.toggle_side_off = this.toggle_side_off.bind(this)
		this.grab_animal = this.grab_animal.bind(this)
		this.full_profile = this.full_profile.bind(this)
		this.new_dog = this.new_dog.bind(this)
		this.get_client = this.get_client.bind(this)
		this.get_payment = this.get_payment.bind(this)
		//this.get_daycare = this.get_daycare.bind(this)
		this.push_alert = this.push_alert.bind(this)
		this.push_notif = this.push_notif.bind(this)
		this.get_print = this.get_print.bind(this)
		this.sqlParse = this.sqlParse.bind(this)
		this.toDatetime = this.toDatetime.bind(this)
		this.dateNow = this.dateNow.bind(this)
		this.dateOut = this.dateOut.bind(this)
		this.forceDate = this.forceDate.bind(this)
		
	}

	async grabDogs(){
       
		// insert => "INSERT INTO dbo.Colours (ColourName) VALUES ('Blue')"
		// delete => "DELETE FROM [KMDB].[dbo].[BookingObjects] where BookingID > 16805"
		// select => "SELECT * FROM dbo.Animals"

		// catch errors in this block
		// fill out empty id's before pushing the sql
		
		let pool = await sql.connect(sqlConfig)
		let result = await pool.request()
			.query("SELECT * from dbo.Animals, dbo.VetDetails, dbo.ClientDetails where dbo.Animals.ClientID = dbo.ClientDetails.ClientID and dbo.ClientDetails.VetSurgeryId = dbo.VetDetails.ID")
		//if err sql.close
		// "SELECT top 1 * from dbo.BookingObjects order by BookingID desc" // returns most recently assigned ID
		let bookings = await pool.request()
			.query("SELECT * from dbo.BookingObjects ,dbo.VetDetails, dbo.Animals, dbo.ClientDetails where dbo.Animals.ClientID = dbo.ClientDetails.ClientID and dbo.Animals.AnimalID =  dbo.BookingObjects.AnimalID and dbo.ClientDetails.VetSurgeryId = dbo.VetDetails.ID")
		//if err sql.close
		let num = await pool.request()
			.query("SELECT  * from dbo.BookingObjects order by BookingID desc")

		let client = await pool.request()
			.query("SELECT  * from dbo.ClientDetails order by ClientID desc")

		let animal = await pool.request()
			.query("SELECT  * from dbo.Animals order by AnimalID desc")

        let extraServices = await pool.request()
            .query("SELECT * FROM dbo.Services")

        let adminSetting = await pool.request()
             .query("SELECT top 1 * FROM dbo.AdminSetting Where IsActive = 1")

        let adminSettingTable = await pool.request()
              .query("SELECT * FROM dbo.AdminSetting");    

		let kennel_map = await pool.request()
			.query("SELECT * FROM dbo.KennelOccupancy ORDER BY ID;")

        

		//if err sql.close

		sql.close()

		this.setState({
			dog_list : result.recordset,
			id_object : {
				booking_id : num.recordset[0].BookingID,
				client_id : client.recordset[0].ClientID,
				animal_id : animal.recordset[0].AnimalID,
			},
			kennel_map : kennel_map.recordset,
            booking_list: bookings.recordset,
            extraService_List : extraServices.recordset,
            adminSetting_List : adminSettingTable.recordset,
            adminSetting : {
				DayCareRate : adminSetting.recordset[0].DayCareRate,
				BookingRate : adminSetting.recordset[0].BookingRate,
				Tax : adminSetting.recordset[0].Tax,
				Discount : adminSetting.recordset[0].Discount,
			},
		})
	}

	push_alert(alert){
		let tmp = this.state.alerts
		tmp.push(alert)
		this.setState({
			alerts : tmp
		})
	}

	push_notif(notification){
		let tmp = this.state.notifications
		tmp.push(notification)
		this.setState({
			notifications : tmp
		})
	}
    
	updateScreen(new_screen){
		this.grabDogs();
		this.setState({
			screen: new_screen
		})
	}
 

	toggle_side(query){
		this.setState({
			sidescreen : true,
			query : query
		})
	}

	toggle_side_off(){
		this.setState({
			sidescreen : false
		})
	}

	new_dog(animal){
		this.setState({
			animal : animal,
			screen : "new_dog"
		}) //simple value
	}

	grab_animal(animal){
		this.setState({
			animal : animal,
			screen : "booking"
		}) //simple value
	}

	full_profile(animal){
		this.setState({
			animal : animal,
			screen : "full_profile"
		})
	}

	get_client(animal){
		this.setState({
			animal : animal,
			screen : "client"
		})
	}

    get_payment(booking) {
		this.setState({
            payBooking: booking,
			screen : "payment"
		})
	}

	get_print(booking){
		this.setState({
			booking : booking,
			screen : "print"
		})
	}

	async get_daycare(animal){

		let date = new Date(Date.now())
		let day = date.toString().substring(0, 3)

		switch (day){
			case 'Mon':
				day = 'm'
				break;
			case 'Tue':
				day = 't'
				break;
			case 'Wed':
				day = 'w'
				break;
			case 'Thu':
				day = 'r'
				break;
			case 'Fri':
				day = 'f'
				break;
			case 'Sat':
				day = 's'
				break;
		}

		let sqlArray = []

		for(let i = 0; i<animal.length;i++){
			this.state.id_object.booking_id++

			let sql_obj = {
				DayCare : 1,
				NoDays : 1,
				AnimalID : animal[i].AnimalID,
				KennelID : 1,
				DateIn : date,
				DateOut : date,
				DayCareRate : 21.99,
				Days : day,
				Discount : animal[i].Discount,
				Status : 'NCI'
			}

			let newobj = JSON.parse(JSON.stringify(sql_obj))
			newobj.DateIn = new Date(Date.parse(newobj.DateIn))
			newobj.DateOut = new Date(Date.parse(newobj.DateOut))

			sqlArray.push(sql_obj)


			newobj.BookingID = this.state.id_object.booking_id
			newobj.AnimalName = animal[i].AnimalName
			newobj.FirstName = animal[i].FirstName
			newobj.LastName = animal[i].LastName
			newobj.Colour = animal[i].Colour
			newobj.Sex = animal[i].Sex
			newobj.Age = animal[i].Age
			newobj.Breed = animal[i].Breed

			this.state.booking_list.unshift(newobj)

		}
	

		//booking_lib.create_booking(sqlArray, false)
		if(!Number.isInteger(sqlArray.KennelID))
			sqlArray.KennelID = sqlArray.KennelID*1
		
		let pool = await sql.connect(sqlConfig)

		for(let i = 0; i < sqlArray.length; i++){
			let new_booking = JSON.parse(JSON.stringify(sqlArray[i]))
			this.forceDate(new_booking)

			new_booking.DateIn = new_booking.DateIn.toString()
			new_booking.DateOut = new_booking.DateOut.toString()

			let keys = ''
			let values = ''
			for (let key in new_booking){
				keys = keys + key + ', '
				if(typeof new_booking[key] === 'string')
					values = values + `'${new_booking[key]}'` + ', '
				else
					values = values + new_booking[key] + ', '
			}

			values = values.slice(0, -2) //trim off the extra comma and whitespace
			keys = keys.slice(0, -2)
			let qr = `INSERT INTO BookingObjects (${keys}) VALUES (${values})`
			await pool.request()
				.query(qr)

			let qr2 = `Update dbo.KennelOccupancy SET Occupancy = 1 WHERE ID = ${new_booking.KennelID}`
			await pool.request()
				.query(qr2)
		}

		sql.close()

		this.setState({
			animal : animal,
			screen : 'home'
		})
		
       this.grabDogs();
	}

	 sqlParse(val){ //sql requires date values to be in 02-07-2018 rather than 2-7-2017
			if (val < 10)
				return '0' + val
			else
				return val
		}

	 toDatetime(date){ // THIS IS PROBABLY INFACT Date.toISOString
			let formatted = `${date.getFullYear()}-${this.sqlParse(date.getMonth() + 1)}-${this.sqlParse(date.getDate())} ${this.sqlParse(date.getHours())}:${this.sqlParse(date.getMinutes())}:${this.sqlParse(date.getSeconds())}`
			return formatted
		}

	 dateNow(){
			let dt = new Date ()
			return dt
		}

	 dateOut(epoch){
			//use an epoch converter to build the check out date
			//epoch is to supposed to be the appointment duration
			let dt = new Date (Date.now() + 604800000)
			return dt
		}

	 forceDate(booking){
			if(booking.DayCare){
				booking.DateIn = this.toDatetime(new Date(Date.now()))
				booking.DateOut = booking.DateIn
			}
			else{
				booking.DateIn = this.toDatetime(new Date(Date.parse(booking.DateIn)))
				booking.DateOut = this.toDatetime(new Date(Date.parse(booking.DateOut)))
			}
		}
		



	

	render(){
		//order props neatly
		//pay booking && booking is passed as undefined
		console.log(this.state.screen)
		return(
			<div style={{backgroundColor: "#D3D3D3"}}>
				<Navbar updateScreen = {this.updateScreen} side = {this.toggle_side} dogs = {this.state.dog_list}/>
                <div className='wrapper'>
                    <Screen new_dog={this.new_dog} kennel_map={this.state.kennel_map} print={this.get_print} boz={this.state.bozun_objesi} updateScreen={this.updateScreen} payment={this.get_payment} booking={this.state.payBooking} id_object={this.state.id_object} animal={this.state.animal} screen={this.state.screen} dogs={this.state.dog_list} bookings={this.state.booking_list} extraServices={this.state.extraService_List} adminSettingTable={this.state.adminSetting_List} currentId={this.state.booking} adminSetting = {this.state.adminSetting}/>
					<Sidescreen alerts = {this.state.alerts} notifications = {this.state.notifications} push_notif = {this.push_notif} updateScreen={this.updateScreen} push_alert = {this.push_alert} daycare = {this.get_daycare} client = {this.get_client} profile = {this.full_profile} proc = {this.grab_animal} dogs = {this.state.dog_list} query = {this.state.query} side = {this.toggle_side_off} sidescreen = {this.state.sidescreen}/>
				</div>
			</div>
		);
	}
}

