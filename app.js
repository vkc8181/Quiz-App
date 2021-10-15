require('dotenv').config()
const express=require('express');
const app=express();
const mongoose=require('mongoose');
const bp=require('body-parser');
app.use(bp.urlencoded({extended:true})); 

//Cloud MongoDB connection
mongoose.connect(process.env.DB)
.then(()=>{console.log("Database connected")})
.catch(err=>{console.log("Couldn't connect:"+err)}); 

 
//Schema definition
const quizSchema = new mongoose.Schema({
	quizid: Number,
	questions: Array
});

const scoreSchema = new mongoose.Schema({
	studentName: String,
	quizid: Number,
	marksObtained:Number,
	maxMarks:Number
});

//Model(collection) creation
const Quiz=new mongoose.model('Quiz',quizSchema);

const Score= new mongoose.model('Score',scoreSchema);


app.get('/',(req,res)=>{
	console.log('visited');
	res.render('home.ejs');
});

app.get('/create',(req,res)=>{
	res.render('quizDetails.ejs');
});

app.post('/create',(req,res)=>{
	console.log(Number(req.body.noOfQues));
	res.render('create.ejs',{noOfQues:Number(req.body.noOfQues)});
});

app.post('/create_quiz',(req,res)=>{
	const quizid=Math.floor(Math.random()*8999)+1000;
	const question_array=[];
	for(var i=1;i<=10;i++){
		const wrongOptions=[];
		wrongOptions.push(req.body[String(i)+"o1"]);
		wrongOptions.push(req.body[String(i)+"o2"]);
		wrongOptions.push(req.body[String(i)+"o3"]);

		const quesObj={
			qNo:i,qStatement:req.body['q'+String(i)],
			correctOption:req.body['a'+String(i)],
			wrongOptions:wrongOptions
		};
		// console.log(quesObj);
		if(quesObj.qStatement)
			question_array.push(quesObj);
	}
	
	//Document creation for insertion in Quiz Collection
	const new_quiz = new Quiz({
		quizid:quizid,
		questions:question_array
	});
	new_quiz.save();
	res.send("<h1>Quiz created. Quiz id = "+quizid+". Kindly note down quiz id</h1>");
});

app.get('/attempt',(req,res)=>{
	Quiz.find({},(err,resp)=>{
		res.render('chooseQuiz.ejs',{quizes:resp});
	});
});


app.get('/attempt/:quizid',(req,res)=>{
	Quiz.find({quizid:req.params.quizid},(err,resp)=>{
		if(err) console.log('err')
		else{
			const questions=[];
			//Option shuffling
			for(let i=0;i<resp[0].questions.length;i++){
				const options=["","","",""];
				const optionDone=[false,false,false,false];
				let randomPosition=Math.floor(Math.random()*4);
				options[randomPosition]=resp[0].questions[i].correctOption;
				optionDone[randomPosition]=true;
				let optionCount=1;
				while(optionCount<4){
					randomPosition=Math.floor(Math.random()*4);
					if(!optionDone[randomPosition]){
						options[randomPosition]=resp[0].questions[i].wrongOptions[optionCount-1];
						// console.log(resp[0].questions[i].wrongOptions);
						optionDone[randomPosition]=true;
						optionCount++;
					}
				}
				let question={qStatement:resp[0].questions[i].qStatement,options:options};
				questions.push(question);
			}
			res.render('attempt.ejs',{quizid:req.params.quizid,questions:questions});
		}
	});
});


app.post('/submit_quiz/:quizid',(req,res)=>{
	Quiz.find({quizid:req.params.quizid},(err,resp)=>{
		if(err) res.send("Something went wrong");
		else{
			console.log(req.body);
			var maxMarks=resp[0].questions.length;
			var obtainedMarks=0;
			for(var i=1;i<=maxMarks;i++){
				if(req.body["ans"+String(i)]===resp[0].questions[i-1].correctOption)
					obtainedMarks++;
			}
			// console.log("obtainedMarks="+obtainedMarks);
			const score=new Score({
				studentName:req.body.studentName,
				quizid:req.params.quizid,
				marksObtained:obtainedMarks,
				maxMarks:maxMarks
			});
			score.save();
			res.send('Your quiz is submitted');
		}
	});
});


app.post('/scores',(req,res)=>{
	Score.find({quizid:req.body.quizid},(err,resp)=>{
		if(err) res.send(err);
		else if(resp[0]){
			
			resp.sort((a,b)=>{
				if(a.marksObtained<b.marksObtained) return 1;
				else if(a.marksObtained>b.marksObtained) return -1;
				return 0;
			});
			res.render('scores.ejs',{scores:resp});
		}
		else{
			res.send('Record not found!!!');
		}
	});
});

let port=process.env.PORT||3000;
app.listen(port,()=>{
	console.log("App running on port "+port);
})
			   
			   
			   
			   
			   
			   
			   
			   
			   
			   