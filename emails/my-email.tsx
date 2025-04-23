export default function TestEmail({name}:{name:string}) {
    console.log('the name is at my-email is ',name)
    return (
      <div>
        <h1>Hello from Finance App 🎉</h1>
        <p>This is a test email component.the name is ${name}</p>
      </div>
    );
  }
  